import React from "react";
import { Typography, Box,Card, CardContent,IconButton,Slider, Button  } from "@mui/material";
import './styles/video.css'
import useVideo from "../../../hooks/useVideo.js";
import StyleVideo from "./style/video.js";
import { Fullscreen, PlayArrow ,Pause} from "@mui/icons-material";
const AdvancedVideoPlayer = ({src, title, thumbnail}) => {
    const {
         handleFullScreen,
        handleSliderChange,
        handleUpdateTime,
        handlePlayPause,
        handlePlayPauseBox,
        isPlaying,
        progress,
        videoRef,
        containerRef,
        showControls,
        handleMouseMove
    } = useVideo()

    return (
        <Card ref={containerRef}  onMouseMove={handleMouseMove} sx={StyleVideo.card} >
            {title && (
                <Typography  variant="h3" sx={StyleVideo.title}> {title} </Typography>
            )}
            <Box sx={StyleVideo.boxVideo} onClick={handlePlayPauseBox}>
                <video 
                ref={videoRef}
                poster={thumbnail}
                onTimeUpdate={handleUpdateTime}
                src={src}
                />

                {/* Play / Pause Button */}
                <IconButton  sx={{
  ...StyleVideo.iconPlayPause,
  opacity: showControls ? 1 : 0,
  pointerEvents: showControls ? "auto" : "none"
}}
 >
                    {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="large" /> }
                </IconButton>

                {/* Fullscreen Button */}
                <IconButton sx={StyleVideo.fullscreenBtn} onClick={handleFullScreen} >
                    <Fullscreen />
                </IconButton>

                {/*  Slider */}
                <Slider sx={{...StyleVideo.slider, opacity: showControls ? 1 : 0,
  pointerEvents: showControls ? "auto" : "none"}} value={progress} onChange={handleSliderChange} />
            </Box>
        </Card>
    )
}


export default AdvancedVideoPlayer;