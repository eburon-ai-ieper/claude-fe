import AuthForm from "./modules/AuthModule/AuthForm";

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center">
      <h1 className="mt-10 text-7xl tracking-wide font-[Montserrat] font-bold">
        Eburon Meet | Admin
      </h1>
      <h3 className="text-3xl font-semibold text-gray-500">
        Manage your teams from here
      </h3>
      <AuthForm />
    </div>
  );
}

export default App;
