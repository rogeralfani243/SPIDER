
const StyleVideo  = {
    card :{
      
        display:'inline-block',
        borderRadius:'10px'
    },
    boxVideo:{
        display:'flex',
        bgcolor: "#000",
        justifyContent:'center',
        position:'relative',
        height:'100%'
    },
    iconPlayPause:{
    
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            bgcolor: "rgba(165, 163, 163, 0.5)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" ,
                 transform: "translate(0)",
            },
            "@media (max-width:600px)": {
      "& .MuiSvgIcon-root": {
        fontSize: 10,
     
      }
    }
    },
    fullscreenBtn:{
        position: "absolute",
            top: 8,
            right: 8,
            color: "white",
            bgcolor: "rgba(0,0,0,0.5)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" }
    },
    slider :{
        position:'absolute',
        left:0,
        bottom:0,
        color:'red'

    }
}


export default StyleVideo;