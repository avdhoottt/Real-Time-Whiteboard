import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencilAlt,
  faSquare,
  faCircle,
  faSlash,
  faEraser,
  faUndo,
  faRedo,
  faShare,
  faTrash,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useParams, useNavigate } from "react-router-dom";
import keycloak from "../Keycloak";

type ElementType = "pencil" | "line" | "rectangle" | "circle" | "eraser";

interface Point {
  x: number;
  y: number;
}

interface Element {
  type: ElementType;
  points: Point[];
  color: string;
  width: number;
}

interface Cursor {
  userId: string;
  username: string;
  x: number;
  y: number;
}

const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [activeType, setActiveType] = useState<ElementType>("pencil");
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(2);
  const [history, setHistory] = useState<Element[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const { socket } = useWebSocket();
  const { id: sessionId } = useParams();
  const [cursors, setCursors] = useState<{ [key: string]: Cursor }>({});

  const shareWhiteboard = () => {
    const url = `${sessionId}`;
    navigator.clipboard.writeText(url);
    alert("Whiteboard link copied to clipboard!");
  };

  useEffect(() => {
    if (socket && sessionId) {
      socket.emit("join-room", sessionId);

      console.log("Socket connected, listening for events");

      socket.on("cursor-move", (data) => {
        console.log("Received cursor move:", data);
        setCursors((prev) => ({
          ...prev,
          [data.userId]: data,
        }));
      });
      socket.on("draw-update", (updatedElements: Element[]) => {
        setElements(updatedElements);
      });

      socket.on("request-canvas-state", () => {
        socket.emit("canvas-state", { sessionId, elements });
      });

      socket.on("draw", (elementData: any) => {
        setElements((prevElements) => [...prevElements, elementData]);
      });

      socket.on("clear", () => {
        setElements([]);
      });

      return () => {
        socket.emit("leave-room", sessionId);
        socket.off("cursor-move");
        socket.off("draw");
        socket.off("draw-update");
        socket.off("request-canvas-state");
        socket.off("clear");
      };
    }
  }, [socket, sessionId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setDrawing(true);

    const newElement: Element = {
      type: activeType,
      points: [{ x: offsetX, y: offsetY }],
      color: activeType === "eraser" ? "#ffffff" : color,
      width: activeType === "eraser" ? width * 2 : width,
    };

    setElements((prev) => [...prev, newElement]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;

    const { offsetX, offsetY } = e.nativeEvent;
    if (socket && sessionId) {
      socket.emit("cursor-move", {
        sessionId,
        userId: socket.id,
        username: keycloak?.tokenParsed?.preferred_username || "Anonymous",
        x: offsetX,
        y: offsetY,
      });
    }
    const currentElement = elements[elements.length - 1];

    const newPoints = [...currentElement.points, { x: offsetX, y: offsetY }];
    const updatedElement = { ...currentElement, points: newPoints };

    setElements((prev) => [...prev.slice(0, -1), updatedElement]);
  };

  const stopDrawing = () => {
    if (!drawing) return;

    if (socket && sessionId) {
      socket.emit("draw", { sessionId, elements });
    }

    setDrawing(false);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), elements]);
    setHistoryIndex((prev) => prev + 1);
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: Element) => {
    if (!element || !element.points || element.points.length === 0) return;

    const roughCanvas = rough.canvas(ctx.canvas);

    if (element.type === "pencil" || element.type === "eraser") {
      ctx.beginPath();
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      element.points.forEach((point, index) => {
        if (!point) return;
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });

      ctx.stroke();
    } else {
      const options = {
        stroke: element.color,
        strokeWidth: element.width,
        roughness: 0,
        bowing: 0,
      };

      if (element.points.length >= 2) {
        const [start, end] = [
          element.points[0],
          element.points[element.points.length - 1],
        ];

        if (!start || !end) return;

        switch (element.type) {
          case "line":
            roughCanvas.line(start.x, start.y, end.x, end.y, options);
            break;

          case "rectangle":
            roughCanvas.rectangle(
              start.x,
              start.y,
              end.x - start.x,
              end.y - start.y,
              options
            );
            break;

          case "circle":
            const radius = Math.sqrt(
              Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            );
            roughCanvas.circle(start.x, start.y, radius * 2, options);
            break;
        }
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (Array.isArray(elements)) {
      elements.forEach((element) => {
        if (element) {
          drawElement(ctx, element);
        }
      });
    }
  }, [elements]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (socket && sessionId) {
      socket.emit("cursor-move", {
        sessionId,
        userId: socket.id,
        username: keycloak?.tokenParsed?.preferred_username || "Anonymous",
        x,
        y,
      });
    }

    if (drawing) {
      const currentElement = elements[elements.length - 1];
      const newPoints = [...currentElement.points, { x, y }];
      const updatedElement = { ...currentElement, points: newPoints };
      setElements((prev) => [...prev.slice(0, -1), updatedElement]);
    }
  };
  const clearCanvas = () => {
    setElements([]);
    if (socket && sessionId) {
      socket.emit("draw", { sessionId, elements: [] });
    }
    setHistory([[]]);
    setHistoryIndex(0);
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      className="whiteboard-app"
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          cursor: activeType === "eraser" ? "crosshair" : "default",
          background: "#ffffff",
        }}
      />
      <div className="floating-toolbar position-absolute top-0 start-50 translate-middle-x mt-3 d-flex gap-2 p-2 bg-white rounded-pill shadow">
        <div className="btn-group">
          {[
            { type: "pencil", icon: faPencilAlt, tooltip: "Pencil" },
            { type: "line", icon: faSlash, tooltip: "Line" },
            { type: "rectangle", icon: faSquare, tooltip: "Rectangle" },
            { type: "circle", icon: faCircle, tooltip: "Circle" },
            { type: "eraser", icon: faEraser, tooltip: "Eraser" },
          ].map((tool) => (
            <button
              key={tool.type}
              className={`btn ${
                activeType === tool.type ? "btn-primary" : "btn-light"
              }`}
              onClick={() => setActiveType(tool.type as ElementType)}
              title={tool.tooltip}
            >
              <FontAwesomeIcon icon={tool.icon} />
            </button>
          ))}
        </div>
      </div>
      <div className="floating-toolbar position-absolute start-0 top-50 translate-middle-y ms-3 bg-white rounded-3 shadow">
        {activeType !== "eraser" && (
          <div className="p-3 border-bottom">
            <input
              type="color"
              className="form-control form-control-color w-100 mb-2"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <div className="d-flex flex-wrap gap-1 justify-content-center">
              {[
                "#000000",
                "#FF0000",
                "#00FF00",
                "#0000FF",
                "#FFFF00",
                "#FF69B4",
              ].map((colorOption) => (
                <button
                  key={colorOption}
                  className="btn p-0 rounded-circle color-option"
                  onClick={() => setColor(colorOption)}
                  style={{
                    backgroundColor: colorOption,
                    width: "20px",
                    height: "20px",
                    border:
                      color === colorOption
                        ? "2px solid #0d6efd"
                        : "1px solid #dee2e6",
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div className="p-3">
          <input
            type="range"
            className="form-range"
            min="1"
            max="20"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
          />
        </div>
      </div>
      <div className="floating-toolbar position-absolute end-0 top-50 translate-middle-y me-3 bg-white rounded-3 shadow">
        <div className="d-flex flex-column p-1">
          <button
            className="btn btn-light btn-sm mb-1"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <FontAwesomeIcon icon={faUndo} />
          </button>
          <button
            className="btn btn-light btn-sm mb-1"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <FontAwesomeIcon icon={faRedo} />
          </button>
          <div className="dropdown-divider"></div>
          <button className="btn btn-light btn-sm mb-1" onClick={saveCanvas}>
            <FontAwesomeIcon icon={faDownload} />
          </button>
          <button
            className="btn btn-light btn-sm mb-1"
            onClick={shareWhiteboard}
          >
            <FontAwesomeIcon icon={faShare} />
          </button>
          <button
            className="btn btn-light btn-sm text-danger"
            onClick={clearCanvas}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>

      {Object.values(cursors).map(
        (cursor) =>
          cursor.userId !== socket?.id && (
            <div
              key={cursor.userId}
              className="cursor-indicator"
              style={{
                position: "absolute",
                left: `${cursor.x}px`,
                top: `${cursor.y}px`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 1000,
              }}
            >
              <div className="cursor-dot" />
              <div className="cursor-label">
                {cursor.username || `User ${cursor.userId.slice(0, 4)}`}
              </div>
            </div>
          )
      )}
    </div>
  );
};

export default Whiteboard;
