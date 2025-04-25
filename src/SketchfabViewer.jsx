import React, { useEffect, useRef } from "react";



const SketchfabViewer = ({ modelUid, success, error }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current) {
      const client = new window.Sketchfab(iframeRef.current);
      client.init(modelUid, {
        ui_infos: 0, // Usage: Setting to 0 will hide the model info bar at the top of the viewer.
        ui_inspector: 0, // Usage: Setting to 0 will hide the inspector button.
        ui_settings: 0, // Usage: Setting to 0 will hide the Settings button.
        ui_vr: 0, // Usage: Setting to 0 will hide the View in VR button.
        ui_ar: 0, // Usage: Setting to 0 will hide the View in AR button.
        ui_watermark_link: 0, // Usage: Setting to 0 remove the link from the Sketchfab logo watermark.
        ui_color: "#D9D9D9", // Usage: Setting to a hexidecimal color code (without the #) or a HTML color name will change the color of the viewer loading bar.
        ui_watermark: 0, // Usage: Setting to 0 remove the Sketchfab logo watermark.
        
        autostart: 1,
        ui_controls:0,
        preload: 1,
        success: success,
        error: () => console.error("Failed to load Sketchfab Viewer."),
      });
    }
  }, [modelUid]);

  return (
    <iframe
      ref={iframeRef}
      title="Sketchfab Viewer"
      className="md:top-[-60px] top-0"
      style={{ width: "100%", height: "100%", position:"absolute", border: "none", backgroundColor:"#D9D9D9", zIndex: 0 }}
    />
  );
};

export default SketchfabViewer;
