import {NavLink} from "react-router-dom";

type NavbarItem = {
    label: string;
    url: string;
}

const navbarItems: NavbarItem[] = [
    {
        label: "My subscriptions",
        url: "my-subscriptions",
    },
    {
        label: "Subscriptions for rent",
        url: "subscriptions-for-rent",
    }
];

function OpenSubsNavbar() {
    return (
        <nav>
            <ul>
                {navbarItems.map((navbarItem, index) => {
                    return (
                        <li key={index}>
                            <NavLink to={`/opensubs/${navbarItem.url}`}>
                                {navbarItem.label}
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default OpenSubsNavbar;
