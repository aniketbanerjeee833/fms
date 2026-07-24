
import { useState} from "react";

// const SearchableSelect = ({
//   id,
//   label,
//   options = [], // array of strings OR objects { id, name }
//   value,
//   onChange,
//   required,
//   register,
//   error,
//   focusStates,
//   handleFocus,
//   handleBlur,
//   displayKey = "name",
// }) => {
//   const [search, setSearch] = useState("");
//   const [open, setOpen] = useState(false);
//   const wrapperRef = useRef(null);

//   // normalize option text
//   const getText = (opt) => (typeof opt === "string" ? opt : opt[displayKey]);

//   // filter based on search
//   const filteredOptions = options.filter((opt) =>
//     getText(opt).toLowerCase().includes(search.toLowerCase())
//   );

//   // display what user typed, else the selected value
//   const displayValue = search !== "" ? search : value || "";

//   // close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div ref={wrapperRef} className="relative mt-2">
//       <label
//         htmlFor={id}
//         className="absolute left-0 -top-5 text-sm text-[#4CA1AF ] transition-all"
//       >
//         {label}
//       </label>

//       <input
//         id={id}
//         type="text"
//         value={displayValue}
//         onChange={(e) => {
//           setSearch(e.target.value); // ✅ allow typing
//           setOpen(true);
//         }}
//         onFocus={() => {
//           setOpen(true);
//           handleFocus?.(id);
//         }}
//         onBlur={(e) => {
//           handleBlur?.(id, e.target.value);
//         }}
//         required={required}
//         {...register(id)}
//         className={`w-full outline-none border-b-2 text-gray-900 transition-all duration-300 bg-transparent
//           ${focusStates?.[id] ? "border-[#4CA1AF ]" : "border-[#6e6e6e]"}`}
//         placeholder={`Search ${label}`}
//       />

//       {open && (
//         <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-40 overflow-y-auto rounded-md shadow-md mt-1">
//           {filteredOptions.length > 0 ? (
//             filteredOptions.map((opt, i) => {
//               const text = getText(opt);
//               return (
//                 <li
//                   key={`${text}-${i}`}
//                   className="px-3 py-2 cursor-pointer hover:bg-[#4CA1AF ] hover:text-white"
//                   onMouseDown={() => {
//                     onChange(text); // set selected value
//                     setSearch(""); // reset typing
//                     setOpen(false);
//                   }}
//                 >
//                   {text}
//                 </li>
//               );
//             })
//           ) : (
//             <li className="px-3 py-2 text-gray-500">No results</li>
//           )}
//         </ul>
//       )}

//       {error && (
//         <p className="text-red-500 text-xs mt-1">{error.message}</p>
//       )}
//     </div>
//   );
// };

// export default SearchableSelect;

const FloatingSelect = ({
  id,
  label,
  options,
  value,
  setValue,
  register,
  errors,
  onSelect, // 👈 new optional callback
}) => {
  const [search, setSearch] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);

  const filteredOptions = options?.filter((opt) =>
    opt?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (opt) => {
    setValue(opt);
    setSearch(opt);
    setOpen(false);
    if (onSelect) onSelect(opt); // 👈 trigger parent logic
  };

  return (
    <div className="relative">
      {focus && (
        <label
          htmlFor={id}
          className="absolute left-0 -top-5 text-sm text-[#4CA1AF ] transition-all"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        {...register(id)}
        required
        value={search}
        onFocus={() => {
          setOpen(true);
          setFocus(true);
        }}
        onBlur={(e) => {
          const typed = e.target.value.trim();

          if (!typed) {
            setValue("");
            setSearch("");
            setFocus(false);
          } else {
            const exists = options.some(
              (opt) => opt.toLowerCase() === typed.toLowerCase()
            );
            if (!exists) {
              setValue("");
              setSearch("");
            } else {
              setValue(typed);
              setSearch(typed);
              if (onSelect) onSelect(typed);
            }
          }
          setOpen(false);
        }}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        className={`w-full outline-none border-b-2 bg-transparent text-gray-900 transition-all duration-300 
          ${focus ? "border-[#4CA1AF ]" : "border-[#6e6e6e]"}`}
        placeholder={focus ? "" : label}
      />

      {open && (
        <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-40 overflow-y-auto rounded-md shadow-md mt-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <li
                key={`${opt}-${i}`}
                className="px-3 py-2 cursor-pointer hover:bg-[#4CA1AF ] hover:text-white"
                onMouseDown={() => handleSelect(opt)}
              >
                {opt}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-500">No results</li>
          )}
        </ul>
      )}

      {errors?.[id] && (
        <p className="text-red-500 text-xs mt-1">{errors[id].message}</p>
      )}
    </div>
  );
};
export default FloatingSelect;






