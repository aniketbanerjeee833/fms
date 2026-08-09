export default function DeleteConfirmModal({
  title = "Delete",
  message = "Are you sure you want to delete this?",
  onClose,
  onConfirm,
  isDeleting = false,
}) {
  return (
    <div
      style={{
        position: "fixed",
        marginTop: "4rem",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        padding: "1rem",
      }}
    >
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 overflow-hidden">
        {/* Header */}
        <div
          className="flex justify-between items-center mb-6"
          style={{ marginBottom: "20px", paddingBottom: "10px" }}
        >
          <h4 className="text-xl font-semibold text-gray-900">{title}</h4>
          <button
            type="button"
            style={{ backgroundColor: "transparent", height: "30px", width: "30px", fontSize: "20px" }}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <p className="text-gray-700 text-sm">{message}</p>

        {/* Footer */}
        <div className="flex justify-end mt-6 gap-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-md text-white"
            style={{ backgroundColor: "#ef4444" }}
          >
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </button>
        
          <button
  style={{ backgroundColor: "gray" }}
  type="button"
  onClick={onClose}
  disabled={isDeleting}
  className="px-5 py-2 rounded-md text-white disabled:opacity-50"
>
  Cancel
</button>
        </div>
      </div>
    </div>
  );
}