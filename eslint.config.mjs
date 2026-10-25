import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat configs, so no FlatCompat bridge is needed.
const eslintConfig = [
	{
		ignores: [
			".next/**",
			".claude/**",
			"node_modules/**",
			"next-env.d.ts",
			"public/**",
			"supabase/functions/**",
			"supabase/migrations/**",
		],
	},
	...nextCoreWebVitals,
	...nextTypescript,
];

export default eslintConfig;
