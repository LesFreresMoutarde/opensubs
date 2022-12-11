import { Link } from "react-router-dom"
import "../css/portal.css"
import {useEffect} from "react";

function Portal() {
    useEffect(() => {
        const initialTitle = document.title;

        document.title = "Portal";

        return (() => {
            document.title = initialTitle;
        })
    }, []);

    return (
        <div id="portal">


            <nav>
                <ul>
                    <li>
                        <Link to="/opensubs/" target="_blank">
                            <div className="logo">
                                <img src="/portal/img/opensubs-logo.png" alt="Logo Opensubs"/>
                            </div>
                            <div className="label">Opensubs</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/fakeflix/" target="_blank">
                            <div className="logo">
                                <img src="/portal/img/fakeflix-logo.png" alt="Logo Fakeflix"/>
                            </div>
                            <div className="label">Fakeflix</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/spooftify/" target="_blank">
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
