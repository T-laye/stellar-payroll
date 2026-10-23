"use client";

import { useState } from "react";

/** The time this component mounted: a stable "now" for render (date pickers' minimums, upcoming lists). */
export function useMountTime() {
	const [now] = useState(() => Date.now());
	return now;
}
