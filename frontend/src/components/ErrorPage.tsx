import {useEffect} from "react";

function ErrorPage() {
    useEffect(() => {
        const initialTitle = document.title;

        document.title = "Error";

        return (() => {
            document.title = initialTitle;
        })
    }, []);

    return (
        <p>Error !</p>
    )
}

export default ErrorPage;
