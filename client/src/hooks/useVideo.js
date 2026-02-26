import { useState, useRef, useEffect } from "react";

export default function useVideo () {
    const videoRef = useRef(null);
    const containerRef =  useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
      const [showControls, setShowControls] = useState(true);
     const timeoutRef = useRef(null);
 useEffect(() => {
    if (isPlaying) {
      timeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }

    return () => clearTimeout(timeoutRef.current);
  }, [isPlaying]);

  // 👇 réapparition quand souris bouge
  const handleMouseMove = () => {
    setShowControls(true);

    if (isPlaying) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
  };


    const handlePlayPause = () => {
        const video = videoRef.current;
        if (!video) return ;
        if (video.paused) {
            video.play()
            setIsPlaying(true)
        } else {
            video.pause()
            setIsPlaying(false)
        }

    }
        const handlePlayPauseBox = () => {
        const video = videoRef.current;
        if (!video) return ;
        if (video.paused) {
            video.play()
            setIsPlaying(true)
        } else {
            video.pause()
            setIsPlaying(false)
        }

    }
    const handleUpdateTime = () => {
        const video = videoRef.current;
        if (!video) return ;
        setProgress((video.currentTime / video.duration) * 100)
    }

    const handleSliderChange = (e, value) => {
        const video = videoRef.current;
        if (!video) return ;
        video.currentTime = (value / 100) * video.duration
        setProgress(value)
    }

    const handleFullScreen = () => {
        if(!containerRef.current) return ;
        if (document.fullscreenElement){
            document.exitFullscreen()
        }else {
            containerRef.current.requestFullscreen()
        }
    }
   
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return ;
        const handleEnded = () => setIsPlaying(false)
        video.addEventListener("ended", handleEnded)
        return  () => video.removeEventListener("ended", handleEnded);
    },[] )

    return {
        handleFullScreen,
        handleSliderChange,
        handleUpdateTime,
        handlePlayPause,
        handlePlayPauseBox,
        handleMouseMove,
        showControls,
        isPlaying,
        progress,
        videoRef,
        containerRef
    }
}