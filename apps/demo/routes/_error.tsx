import type { FunctionComponent } from "npm:preact@^10";

type PageProps = {
  error: unknown;
  url: URL;
};

const ErrorPage: FunctionComponent<PageProps> = (props) => {
  const status = (props.error && typeof props.error === "object" && props.error !== null &&
      "status" in props.error)
    ? String((props.error as Record<string, unknown>).status)
    : "500";

  return (
    <div style="padding: 24px;">
      <h1>{status} - Something went wrong</h1>
      <p>{props.url.toString()}</p>
    </div>
  );
};

export default ErrorPage;
