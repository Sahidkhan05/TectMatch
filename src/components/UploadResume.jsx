export default function UploadResume() {
    return (
        <div className="bg-white rounded-xl shadow p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">
                Upload Resume
            </h2>

            <div className="border-2 border-dashed border-gray-300 p-10 rounded-lg text-center">

                <p className="text-gray-500">
                    Drag & Drop resumes here
                </p>

                <p className="text-sm text-gray-400 mt-2">
                    Upload single or multiple PDF files
                </p>

                <button className="mt-5 bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800">
                    Choose Files
                </button>

            </div>
        </div>
    );
}