import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState("");

  const createNewSession = () => {
    const newSessionId = uuidv4();
    navigate(`/whiteboard/${newSessionId}`);
  };

  const joinSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId.trim()) {
      navigate(`/whiteboard/${sessionId}`);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="container-fluid min-vw-full">
        <div className="row justify-content-center">
          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-center mb-4">
                  Welcome to Collaborative Whiteboard
                </h2>

                <div className="d-grid gap-3">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={createNewSession}
                  >
                    Create New Whiteboard
                  </button>

                  <div className="text-center">
                    <p className="text-muted">- OR -</p>
                  </div>

                  <form onSubmit={joinSession}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control form-control-md"
                        placeholder="Enter Session ID"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                      />
                      <button
                        className="btn btn-outline-primary btn-lg"
                        type="submit"
                      >
                        Join Session
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
