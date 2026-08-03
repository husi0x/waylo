import { EXIT_PAGE_CSS, EXIT_PAGE_DEFAULTS, normalizeCountdown, textOrDefault } from "../exit-page-config.mjs";

type ExitPagePreviewProps = {
  heading: string;
  subtext: string;
  button: string;
  customLabel: string;
  customUrl: string;
  countdown: unknown;
};

export function ExitPagePreview(props: ExitPagePreviewProps) {
  const heading = textOrDefault(props.heading, EXIT_PAGE_DEFAULTS.heading, 80);
  const subtext = textOrDefault(props.subtext, EXIT_PAGE_DEFAULTS.subtext, 220);
  const button = textOrDefault(props.button, EXIT_PAGE_DEFAULTS.button, 40);
  const countdown = normalizeCountdown(props.countdown);

  return (
    <div className="exit-preview-frame" aria-label="Exit page preview">
      <style>{EXIT_PAGE_CSS}</style>
      <div className="exit-page-shell">
        <div className="exit-page-card" aria-labelledby="exit-preview-title" aria-describedby="exit-preview-description">
          <div className="exit-age-icon" aria-hidden="true"><span>18</span></div>
          <h1 className="exit-page-title" id="exit-preview-title">{heading}</h1>
          <p className="exit-page-subtext" id="exit-preview-description">{subtext}</p>
          <button
            className="exit-page-primary"
            type="button"
            onClick={(event) => event.preventDefault()}
            aria-label={button}
          >
            {button}
          </button>
          <p className="exit-page-status">
            Opening automatically in {countdown} {countdown === 1 ? "second" : "seconds"}…
          </p>
          {props.customLabel.trim() && props.customUrl.trim() ? (
            <div className="exit-page-fallback">
              <a className="exit-page-custom" href="#" onClick={(event) => event.preventDefault()}>
                {props.customLabel.trim().slice(0, 40)}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
