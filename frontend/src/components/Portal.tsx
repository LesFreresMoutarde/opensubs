import { Link } from "react-router-dom"

function Portal() {
    return (
        <nav>
            <ul>
                <Link to="/opensubs">Opensubs</Link>
            </ul>
            <ul>
                <Link to="/fakeflix">Fakeflix</Link>
            </ul>
            <ul>
                <Link to="/spooftify">Spooftify</Link>
            </ul>
        </nav>
    )
}

export default Portal
