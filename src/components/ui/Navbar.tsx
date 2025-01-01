import {Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button} from "@nextui-org/react";

export const AcmeLogo = () => {
  return (
    <svg fill="none" height="36" viewBox="0 0 32 32" width="36">
      <path
        clipRule="evenodd"
        d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default function AppBar() {
  return (
    <Navbar className="py-4 bg-slate-500">
      <NavbarBrand>
        <AcmeLogo />
        <Link href="/">
        <p className="font-bold text-inherit">Expense Tracker</p>
        </Link>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-7" justify="center">
        <NavbarItem>
          <Link href="/dashboard">
            DashBoard
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link aria-current="page" href="/add-transaction">
            Add Transaction
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="/history">
            History
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="hidden lg:flex">
          <Link href="/signin">Login</Link>
        </NavbarItem>
        <NavbarItem>
          <Button as={Link} color="primary" href="/signup" variant="flat">
            Sign Up
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
