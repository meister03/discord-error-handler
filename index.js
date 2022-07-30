const { WebhookClient, EmbedBuilder } = require("discord.js");

class handling {
    constructor(client, options = {}) {
        this.client = client;
        this.webhook = (options.webhook ? new WebhookClient(options.webhook) : false);
        this.stats = options.stats || false;
        if (!this.client) throw new Error("Discord_Client_not_provided", "missing", "specified.");
        if (!this.webhook) throw new Error("Webhook_Token_or_Id_not_provided", "missing", "specified.");
        this.client.error = new Map();
    }
    /**
* @param {object} [client] - Discord client, will save the data in a Map to prevent multiple fetches
* @param {string} [guildId] - Discord guild id.
* @param {string} [msg] - the messsage which caused the error
* @param {string} [errorr] - the error
*/

    async createrr(client, guildId, msg, errorr) {
        if (!client) throw new TypeError("An client was not provided.");
        if (!errorr) throw new TypeError("An errorr was not provided.");
        if (!this.webhook) throw new TypeError("You did not added a webhook id or a token in the options");
        const clean = text => {                 // is a function
            text = String(text);                 //strings the function
            let searched = text.split("\n");    //splits by /n
            return searched[0];                // returns the splited array
        };
        let cleaned = clean(errorr);
        if (client.error.has(cleaned)) {
            client.error.set(cleaned, { ///this saves the error in a map, to prevent multipy errors
                guildid: guildId,
                msg: msg,
                stack: errorr.stack,
                error: cleaned,
                count: client.error.get(cleaned).count + 1,
                date: Date.now(),
                msgid: client.error.get(cleaned).msgid,
                channelid: client.error.get(cleaned).channelid,

            });

        } else {
            if (client.error.has("allerrors")) {
                let allerrors = client.error.get("allerrors").allerrors;
                allerrors.push(cleaned);
                client.error.set("allerrors", {
                    allerrors: allerrors,
                });
            } else {
                client.error.set("allerrors", {
                    allerrors: [cleaned],
                });
            }

            let log = new EmbedBuilder()
                .setTitle("New Error Encountered!");
            if (msg) {
                log.addFields({ name:`On message in ${guildId}:`, value: "```" + msg + "```" });
            }
            log.addFields({ name: "Error",  value: "```" + smaller(errorr.stack, 800) + "```" });
            log.setColor("RED");
            log.setTimestamp();


            const servermessage = await this.webhook.send({ embeds: [log] });
            console.log(errorr);

            client.error.set(cleaned, { ///this saves the msgid in a map to prevent a fetch
                guildid: guildId,
                msg: msg,
                error: cleaned,
                count: 1,
                stack: errorr.stack,
                date: Date.now(),
                msgid: servermessage.id,
                channelid: servermessage.channel_id,
            });
        }
        return;
    }
    /**
* @param {object} [message] - Discord message parameter to send the message;
* @param {object} [client] - Discord client, will save the data in a Map to prevent multiple fetches
*/
    async report(client, message) {
        try {
            if (!message || !client) throw new TypeError("A client or message was not provided.");
            let allerror = [];
            let count = 0;
            let i;

            if (client.error.has("allerrors")) {

                for (i = 0; i < client.error.get("allerrors").allerrors.length; i++) {
                    let errorr = client.error.get(client.error.get("allerrors").allerrors[i]);
                    allerror.push(`**[${errorr.error}](https://discord.com/channels/${message.guild.id}/${errorr.channelid}/${errorr.msgid})** - **${errorr.count} **`);
                    count = count + errorr.count;
                }
            }
            if (!allerror[0]) allerror.push("No Errors have been found!");
            let report = new EmbedBuilder()
                .setTitle("Error Message - Count")
                .setDescription("```" + i + " Errors happend " + count + " times" + "```\n" + smaller(allerror.join("\n"), 1800))
                .setFooter("Requested by: " + message.author.tag, message.author.displayAvatarURL())
                .setTimestamp()
                .setColor("YELLOW");
            return message.channel.send({ embeds: [report] });
        } catch (error) {
            console.log(error);
        }
    }
    /**
* @param {object} [client] - Discord client for Broadcast Evaling + Getting Info
*/
    async status(client) {
        if (!client) throw new TypeError("A client was not provided");
        if (!client.shard && !client.cluster) return console.log("This function is currenlty just availble for Sharding/Clustering!");

        async function cpuUsageCompact(time) {
            let start = [process.hrtime(), process.cpuUsage()];
            await new Promise(r => setTimeout(r, time));
            let elap = [process.hrtime(start[0]), process.cpuUsage(start[1])];
            return 100 * (elap[1].user / 1000 + elap[1].system / 1000) / (elap[0][0] * 1000 + elap[0][1] / 1000000);
        }
        //Client Instance: 
        const instance = (client.shard ? client.shard : client.cluster);

        let forcpu = await instance.broadcastEval(`${await cpuUsageCompact(100)}`);
        let forram = await instance.broadcastEval("(process.memoryUsage().rss / 1024 / 1024)");
        let forping = await instance.broadcastEval("(this.ws.ping)");
        let forstatus = await instance.broadcastEval("(this.ws.status)");

        let eachstatus = [];
        for (let i = 0; i < instance.count; i++) {
            eachstatus.push({ id: i, online: (forping[i] ? true : false), ping: forping[i], cpu: forcpu[i].toFixed(2), ram: forram[i].toFixed(2), status: forstatus[i] });
        }
        return eachstatus;
    }

}

module.exports = handling;

function smaller(string, limit) {
    if (string.length <= limit) {
        return string;
    }
    return string.slice(0, limit) + "...";
}
