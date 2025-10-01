import { Link } from 'react-router-dom';
import '../css/Navbar/Navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-logo">Mesoft</div>
            <ul className="navbar-links">
                <li><Link to="/">Inicio</Link></li>
                <li><Link to="/mesas">Mesas</Link></li>
                <li><Link to="/meseros">Meseros</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;