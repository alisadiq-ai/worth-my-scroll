# Chrome Web Store distribution

Research checked September 23, 2026. This is a publication plan, not an approval or completed compliance audit.

## Practical path

An unlisted release is useful for a first group of users: anyone with the listing URL can install it, without appearing in public store searches. Both unlisted and public submissions must pass Google's review. Local unpacked installation remains the developer-mode route outside the store.

Before submission, prepare a developer account, extension ZIP, screenshots, accurate listing, a publicly reachable privacy policy, permission/data-use explanations, and reviewer instructions for the BYOK setup. The existing consent flow and narrow permissions should be audited against current store rules. Do not promise approval. Review usually takes a few days but may take weeks.

LinkedIn's policy is a separate material issue: it prohibits certain third-party extensions that scrape, modify the appearance of, or automate activity on LinkedIn. Worth My Scroll reads displayed posts and adds UI, so platform-policy compatibility needs assessment before a broader launch; store approval would not establish LinkedIn permission.

## Official sources

- [Review process](https://developer.chrome.com/docs/webstore/review-process)
- [Public, unlisted, and private distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution)
- [Publishing](https://developer.chrome.com/docs/webstore/publish/)
- [Developer registration](https://developer.chrome.com/docs/webstore/register)
- [User-data policy FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [LinkedIn prohibited software and extensions](https://www.linkedin.com/help/linkedin/answer/a1341387)

## Effort estimate and current security finding

Planning estimate: roughly half to one working day for a release security pass, packaging, screenshots, store copy, disclosures, and reviewer instructions, assuming account access is ready and no larger issues emerge. Updating the README, landing-page install buttons, and repository description after approval is about 15–30 minutes. Google review is separate: commonly days, potentially weeks.

Unlisted distribution removes the clone/build/Developer Mode installation steps. Users still need their own provider key, billing/credits, preferences, and consent. No store submission has been made.

The current worker restricts both storage areas to TRUSTED_CONTEXTS, denies settings/key messages from the feed script, sends authenticated evaluations only to fixed HTTPS provider endpoints, rejects redirects, and uses session-only key storage by default. Optional Remember writes the key to chrome.storage.local without application-level encryption. Google's secure-handling FAQ includes encryption at rest requirements. Resolve persistent credential handling before submission; recommend removing remembered keys from the first store release and migrating any existing remembered key into session storage, or designing an actual encrypted vault with separately protected key material. Putting an encryption key beside the ciphertext would not meaningfully protect the credential. This is a proposed release change, not implemented in the current version.

A focused inspection and existing tests are not an independent security audit. LinkedIn policy compatibility remains a separate unresolved distribution concern even for an unlisted store release.

GitHub About has one website URL field. Keep the landing page there and add the eventual store URL to the description if desired; the README and landing page can have direct Add to Chrome links. Do not invent a store URL before a listing exists.
