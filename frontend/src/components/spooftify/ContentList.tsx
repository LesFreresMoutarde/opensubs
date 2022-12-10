import {useContext} from "react";
import {spooftifyAppContext} from "../SpooftifyApp";

function ContentList() {
    const {content, selectedItem, selectItem} = useContext(spooftifyAppContext);

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
                        <tr key={index} onClick={() => {
                            if (selectedItem !== null && selectedItem[0] === index) {
                                selectItem(null);
                                return;
                            }

                            selectItem(index)
                        }}>
                            <td className="index-cell">
                                <div className="index">
                                    {(() => {
                                        if (selectedItem && selectedItem[0] === index) {
                                            return <i className="fa-solid fa-play"/>;
                                        }

                                        return index + 1;
                                    })()}
                                </div>
                                <div className="play-button">
                                    {(() => {
                                        if (selectedItem && selectedItem[0] === index) {
                                            return <i className="fa-solid fa-stop"/>;
                                        }

                                        return <i className="fa-solid fa-play"/>
                                    })()}
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
