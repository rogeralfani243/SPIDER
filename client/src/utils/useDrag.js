const useParamDrag = () => {
  const prevent = (e) => e.preventDefault();

  return {
    onSelectStart: prevent,
    onContextMenu: prevent,
    onCopy: prevent,
    onDragStart: prevent,
   
  };
};

export default useParamDrag;
