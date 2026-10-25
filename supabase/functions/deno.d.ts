declare module "https://esm.sh/@supabase/supabase-js@2.48.1" {
  export * from "@supabase/supabase-js";
}

declare module "https://deno.land/std@0.224.0/http/server.ts" {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
