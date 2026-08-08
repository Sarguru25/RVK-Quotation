export default function ErrorMessage({ message }) {
  if (!message) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-red-800 text-sm font-medium">{message}</p>
        </div>
    );
} 