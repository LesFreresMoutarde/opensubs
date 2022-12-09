import {NavLink} from "react-router-dom";

type NavbarItem = {
    label: string;
    url: string;
}

const navbarItems: NavbarItem[] = [
    {
        label: "Home",
        url: "",
    },
    {
        label: "Buy a subscription",
        url: "mint",
    }
];

interface ServiceAppNavbarProps {
    urlPrefix: string;
}

function ServiceAppNavbar({urlPrefix}: ServiceAppNavbarProps) {
    return (
        <nav>
            <ul>
                {navbarItems.map((navbarItem, index) => {
                    return (
                        <li key={index}>
                            <NavLink to={`${urlPrefix}${navbarItem.url}`}>
                                {navbarItem.label}
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default ServiceAppNavbar;
