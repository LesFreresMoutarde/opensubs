import {useContext} from "react";
import {fakeflixAppContext} from "../FakeflixApp";

function FakeflixContent() {
    const {content, selectedItem, selectItem} = useContext(fakeflixAppContext);

    return (
        <div className="movies-list">
            {content.map((item, index) => {
                return (
                    <div key={index} className="movie">
                        <div className="movie-cover">
                            <img src={item.coverUrl} alt="Cover"/>
                        </div>
                        <div className="movie-data">
                            <div className="title">
                                {item.title}
                            </div>
                            <div className="director">
                                {item.director}
                            </div>
                            <div className="actors">
                                {item.actors.join(', ')}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default FakeflixContent;
