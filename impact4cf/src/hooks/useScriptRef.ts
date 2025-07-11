import { useEffect, useRef } from 'react';

// ==============================|| ELEMENT REFERENCE HOOKS ||============================== //



//ask TA about this, our error message does not show since we immediately set our component of unmounted????, but this suggest the berry template is incorrect which is unlikely

// export default function useScriptRef() {
//   const scripted = useRef(true);

//   useEffect(() => {
//     scripted.current = false;
//   }, []);

//   return scripted;
// }






export default function useScriptRef() {
  const scripted = useRef(true);  // Start as true when component mounts

  useEffect(() => {
    // Keep it true while mounted
    scripted.current = true;

    // Set to false only when component unmounts
    return () => {
      scripted.current = false;
    };
  }, []);

  return scripted;
}
