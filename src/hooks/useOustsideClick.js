import { useEffect } from 'react'

export default function useOutsideClick(ref, cb) {
    useEffect(() => {
        const handleClick = (e) => {
            if(ref && !ref.current.contains(e.target)) {
                cb();
            }
        }

        document.addEventListener("mousedown", handleClick);
        return () => {
            document.removeEventListener("mousedown", handleClick)
        } 
    }, [ref, cb])
}
