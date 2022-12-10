import {useContext, useEffect, useMemo, useState} from "react";
import {spooftifyAppContext} from "../SpooftifyApp";

function AudioPlayer() {
    const {selectedItem, selectItem} = useContext(spooftifyAppContext);

    const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<HTMLAudioElement | null>(null);

    // The current playing time of the audio, in seconds
    const [currentAudioTime, setCurrentAudioTime] = useState(0);

    const item = useMemo(() => {
        if (!selectedItem) {
            return null;
        }

        return selectedItem[1];
    }, [selectedItem]);

    // Value between 0 and 1 (0 = start, 1 = end)
    const audioProgression = useMemo(() => {
        if (currentlyPlayingAudio === null) {
            return 0;
        }

        return currentAudioTime / currentlyPlayingAudio.duration;
    }, [currentAudioTime, currentlyPlayingAudio]);

    useEffect(() => {
        if (currentlyPlayingAudio !== null) {
            currentlyPlayingAudio.pause();
            currentlyPlayingAudio.currentTime = 0;

            setCurrentlyPlayingAudio(null);
        }

        if (item === null) {
            return;
        }

        const audio = new Audio(item.songUrl);

        audio.ontimeupdate = () => {
            setCurrentAudioTime(audio.currentTime);
        }

        audio.onended = () => {
            selectItem(null);
        }

        audio.play();

        setCurrentlyPlayingAudio(audio);
    }, [item, selectItem]);

    return (
        <div className="audio-player">
            {item !== null &&
            <div className="left">
                <div className="cover">
                    <img src={item.coverUrl} alt="Cover"/>
                </div>
                <div className="title-and-artist">
                    <div className="title">
                        {item.title}
                    </div>
                    <div className="artist">
                        {item.artist}
                    </div>
                </div>
            </div>
            }

            <div className="center">
                {item === null &&
                <div className="no-song-selected-music-message">
                    Please select a song to play
                </div>
                }

                {item !== null &&
                <div className="audio-controls">
                    <div className="audio-control-buttons">
                        <button className="stop-button" onClick={() => selectItem(null)}>
                            <span className="inner">
                                <i className="fa-solid fa-stop"/>
                            </span>
                        </button>
                    </div>
                    <div className="audio-controls-progression">
                        <div className="progress-bar">
                            <div className="progress-bar-inner"
                                 style={{
                                     width: `${audioProgression * 100}%`
                                 }}
                            />
                        </div>
                    </div>
                </div>
                }
            </div>

            {item !== null &&
            <div className="right">

            </div>
            }
        </div>
    );
}

export default AudioPlayer;
