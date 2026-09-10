# Privileged intents review

Review deadline: **9 October 2026**.

Emerald should request approval for **Guild Members** and **Message Content** only. **Presence is not required** and has been removed from the Gateway configuration.

## Intent audit

| Privileged intent | Decision | Required functionality |
| --- | --- | --- |
| Guild Members | Keep and submit | Receives role changes for role greetings; fetches members for member counts; resolves members and their roles for Emerald and Nadeko XP role rewards. |
| Message Content | Keep and submit | Parses the bot's established prefix commands and their arguments; processes eligible message text for the optional XP system; and reads messages/attachments used by configured application, attachment and reaction-log workflows. |
| Presence | Remove | It was used only to add online/idle/DND/device statistics to `membercount`. The command now reports total users and bots without collecting presence data. |

Message Content does not control delivery of message events. The standard Guild Messages, Direct Messages and reaction intents remain enabled for commands and services, while unrelated standard intents are no longer requested.

## Suggested submission text

### Guild Members

> Emerald is a server-administration and utility bot. It requires Guild Members to receive guild member updates when a member's roles change so configured role greetings can be sent. It also fetches or resolves guild members and their current role memberships to maintain configured XP role rewards, including optional integration with a self-hosted Nadeko bot, and to provide an on-demand user/bot member count. The data is used only to perform these server-configured functions. Emerald does not use presence data and does not request the Guild Presences intent.

### Message Content

> Emerald is an established prefix-command bot built on Discord.js Commando. It requires Message Content to recognize server-configurable prefix commands and parse their arguments in guild channels. Message content is also necessary for optional, administrator-configured features: character-based XP awards, application approval/archive handling, attachment logging, reaction logging, automatic announcement publishing, message expiry and configured reaction channels. These features operate only in servers and channels where administrators configure or invoke them. Emerald does not use message content for advertising, profiling, sale of data or training machine-learning models.

## Data-handling answers

Use these statements only if they remain accurate for the production deployment:

- Message text is processed to execute commands and configured services. XP stores a numeric score, not the source message text.
- Application and logging features can copy message text or attachment metadata into administrator-selected Discord channels. The application workflow can upload application attachments to the configured Google Cloud Storage bucket before archiving the result.
- Guild member IDs, role IDs, channel IDs, configuration and XP totals are persisted in Emerald's configured storage.
- Access is limited to the bot process and infrastructure controlled by the operator. Discord server permissions and Emerald's command permissions limit user access.
- Data is retained while the relevant server configuration or feature data remains in storage. Server administrators can disable features; operational deletion requests must be handled by the operator.

Before submitting, verify the production configuration, privacy policy URL, data deletion/contact process, and current installation/user counts in the Developer Portal. Do not claim that Emerald never stores message-derived data if the application/archive feature and its Cloud Storage integration are enabled.

## Portal and deployment checklist

1. Submit Guild Members and Message Content in **Developer Portal → Emerald → Bot → Privileged Gateway Intents** before 9 October 2026.
2. Leave Presence unselected in the review and disable its portal toggle after deploying this change.
3. Deploy this branch before Discord removes existing access. The old `Intents.ALL` identify payload will fail with Gateway close code 4014 once any requested privileged intent is unavailable.
4. Run `npm ci`, `npm run lint` and `npm test` on the deployment runtime.
5. Confirm prefix commands, role greetings, XP role rewards, application approval, attachment/reaction logs and `membercount` in a test server.
