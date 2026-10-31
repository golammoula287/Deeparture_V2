export const Card = ({ children, className = "" }) => <section className={`rounded-2xl border bg-white p-4 md:p-5 ${className}`}>{children}</section>;
export const Label = ({ children }) => <label className="text-sm font-medium text-gray-700">{children}</label>;
export const Input = props => <input {...props} className={`border rounded-lg px-3 py-2 w-full ${props.className || ""}`} />;
export const Textarea = props => <textarea {...props} className={`border rounded-lg px-3 py-2 w-full min-h-24 ${props.className || ""}`} />;
export const Select = props => <select {...props} className={`border rounded-lg px-3 py-2 w-full ${props.className || ""}`} />;
export const Button = ({ children, kind = "primary", ...props }) => <button {...props} className={`${kind === "secondary" ? "border bg-white text-gray-900" : kind === "danger" ? "bg-red-700 text-white" : "bg-green-700 text-white"} rounded-lg px-4 py-2 font-semibold disabled:opacity-50 ${props.className || ""}`}>{children}</button>;
export const Badge = ({ children }) => <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs">{children}</span>;
export const Message = ({ children, error }) => children ? <p className={`mt-3 text-sm ${error ? "text-red-700" : "text-green-700"}`}>{children}</p> : null;
