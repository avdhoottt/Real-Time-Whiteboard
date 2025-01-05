import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { useKeycloak } from "@react-keycloak/web";

const Navbar = () => {
  const { keycloak } = useKeycloak();

  return (
    <nav className="navbar navbar-expand-lg navbar-primary bg-primary min-vw-100">
      <div className="container-fluid px-4">
        <Link className="navbar-brand text-white" to="/">
          Collaborative Whiteboard
        </Link>
        <div className="d-flex">
          <Link to="/" className="btn btn-link text-white text-decoration-none">
            <FontAwesomeIcon icon={faHome} className="me-2" />
            Home
          </Link>
          {!keycloak?.authenticated ? (
            <button
              className="btn btn-outline-light ms-3"
              onClick={() => keycloak?.login()}
            >
              Login
            </button>
          ) : (
            <button
              className="btn btn-outline-light ms-3"
              onClick={() => keycloak?.logout()}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
              Logout{" "}
              {keycloak?.tokenParsed?.preferred_username &&
                `(${keycloak.tokenParsed.preferred_username})`}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
