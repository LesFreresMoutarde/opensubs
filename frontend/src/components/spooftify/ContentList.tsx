import {useContext} from "react";
import {spooftifyAppContext} from "../SpooftifyApp";

function ContentList() {
    const {content} = useContext(spooftifyAppContext);

    return (
        <div className="content-list">
            <table className="spooftify-content-table">
                <thead>
                <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Artist</th>
                </tr>
                </thead>
                <tbody>
                {content.map((item, index) => {
                    return(
                        <tr key={index}>
                            <td className="index-cell">
                                <div className="index">
                                    {index + 1}
                                </div>
                                <div className="play-button">
                                    ▶
                                </div>
                            </td>
                            <td className="title-cell">
                                <div className="cover">
                                    <img src={item.coverUrl} alt="Cover"/>
                                </div>
                                <div className="title">
                                    {item.title}
                                </div>
                            </td>
                            <td className="artist-cell">
                                {item.artist}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

export default ContentList;
