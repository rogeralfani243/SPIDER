import { useEffect } from "react";

const useParamDrag = () => {

  useEffect(() => {

    const prevent = (e) => e.preventDefault();

    // bloque drag classique
    document.addEventListener("dragstart", prevent);
    document.addEventListener("drop", prevent);

    // bloque sélection texte
    document.addEventListener("selectstart", prevent);

    // bloque clic droit (optionnel)
    document.addEventListener("contextmenu", prevent);


    return () => {
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("drop", prevent);
      document.removeEventListener("selectstart", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("touchmove", prevent);
    };

  }, []);

};

export default useParamDrag;
