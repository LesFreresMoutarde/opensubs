import { Link } from "react-router-dom"
import "../css/portal.css"

function Portal() {
    return (
        <div id="portal">


            <nav>
                <ul>
                    <li>
                        <Link to="/opensubs">
                            <div className="logo">
                                <img src="/portal/img/opensubs-logo.png" alt="Logo Opensubs"/>
                            </div>
                            <div className="label">Opensubs</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/fakeflix">
                            <div className="logo">
                                <img src="/portal/img/fakeflix-logo.png" alt="Logo Fakeflix"/>
                            </div>
                            <div className="label">Fakeflix</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/spooftify">
                            <div className="logo">
                                <img src="/portal/img/spooftify-logo.png" alt="Logo Fakeflix"/>
                            </div>
                            <div className="label">Spooftify</div>
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    )
}

export default Portal
