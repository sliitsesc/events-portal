import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="min-h-svh w-full bg-[radial-gradient(80%_50%_at_10%_0%,#fef3c7,transparent),radial-gradient(70%_45%_at_90%_20%,#dbeafe,transparent)] px-5 py-8 md:py-14">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
