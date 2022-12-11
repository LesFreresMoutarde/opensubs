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
        <div className="container-fluid d-flex align-items-center justify-content-center vh-100">
            <h1 className="text-white">404 - Not Found</h1>
        </div>
    )
}

export default ErrorPage;
