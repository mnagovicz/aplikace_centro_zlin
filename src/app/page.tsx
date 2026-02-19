export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 text-center">
      <h1 className="mb-2 text-4xl font-bold text-blue-900">
        OC Centro Zlín
      </h1>
      <p className="mb-8 text-lg text-blue-600">Soutěžní hra</p>
      <div className="max-w-sm rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          Pro začátek hry naskenujte QR kód na jednom ze stanovišť v obchodním
          centru.
        </p>
      </div>
    </div>
  );
}
