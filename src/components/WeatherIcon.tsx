import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideProps,
} from "lucide-react";
import { describeWeather } from "@/lib/weather";
import { cx } from "./ui";

export function WeatherIcon({
  code,
  isDay = true,
  className,
  ...props
}: { code: number; isDay?: boolean } & LucideProps) {
  const { kind } = describeWeather(code);
  const Icon =
    kind === "clear"
      ? isDay
        ? Sun
        : Moon
      : kind === "partly"
        ? isDay
          ? CloudSun
          : CloudMoon
        : kind === "fog"
          ? CloudFog
          : kind === "drizzle"
            ? CloudDrizzle
            : kind === "rain"
              ? CloudRain
              : kind === "snow"
                ? CloudSnow
                : kind === "storm"
                  ? CloudLightning
                  : Cloud;
  const tint = kind === "clear" || kind === "partly" ? "text-warm" : "text-accent";
  return <Icon aria-hidden className={cx(tint, className)} strokeWidth={1.75} {...props} />;
}
