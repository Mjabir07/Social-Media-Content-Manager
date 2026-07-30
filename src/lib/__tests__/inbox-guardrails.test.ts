import { describe, expect, it } from "vitest";
import { shouldAutoReply } from "@/lib/inbox-guardrails";

const IN = (body: string) => ({ direction: "IN", body });
const OUT = (body: string) => ({ direction: "OUT", body });

describe("auto-reply guardrails", () => {
  it("replies to a normal inbound message", () => {
    expect(shouldAutoReply([IN("Hi, what are your hours?")]).reply).toBe(true);
  });

  it("hands off to a human on an escalation keyword", () => {
    const r = shouldAutoReply([IN("I want a refund, this is a complaint")]);
    expect(r.reply).toBe(false);
    expect(r.reason).toMatch(/escalation/);
  });

  it("detects the keyword case-insensitively anywhere in the text", () => {
    expect(shouldAutoReply([IN("Can I talk to a HUMAN please")]).reply).toBe(false);
  });

  it("stops after the auto-reply cap to avoid a runaway loop", () => {
    const many = [IN("hi"), OUT("1"), OUT("2"), OUT("3"), OUT("4"), OUT("5"), OUT("6"), IN("still there?")];
    expect(shouldAutoReply(many).reply).toBe(false);
  });

  it("does nothing when there is no inbound message", () => {
    expect(shouldAutoReply([OUT("hello")]).reply).toBe(false);
  });
});
