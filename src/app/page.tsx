/* eslint-disable @next/next/no-img-element */
export default function HomePage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: "#E8637A" }}
    >
      <img
        src="/logo.jpg"
        alt="OC Centro Zlín"
        className="mb-6 h-40 w-40 rounded-full object-cover shadow-lg"
      />
      <h1 className="mb-2 text-4xl font-bold text-white">
        OC Centro Zlín
      </h1>
      <p className="mb-8 text-lg text-white/80">Soutěžní hra</p>
      <div className="max-w-sm rounded-lg bg-white/95 p-6 shadow-lg">
        <p className="text-sm text-gray-700">
          Pro začátek hry naskenujte QR kód na jednom ze stanovišť v obchodním
          centru.
        </p>
      </div>
    </div>
  );
}
