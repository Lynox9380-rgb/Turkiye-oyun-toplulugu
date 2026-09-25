const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIXES = [".", "!", "TOT!"];

const GAMES = [
  "Minecraft",
  "Valorant",
  "Roblox",
  "GTA V",
  "Counter-Strike 2",
  "EA SPORTS FC",
  "Fortnite",
  "League of Legends",
  "Apex Legends",
  "Genshin Impact",
  "Overwatch 2",
  "PUBG",
  "PUBG Mobile",
  "Call of Duty",
  "Rocket League",
  "Brawl Stars",
  "Clash Royale",
  "Clash of Clans",
  "Mobile Legends",
  "Among Us",
  "Rust",
  "The Sims 4",
  "Euro Truck Simulator 2",
  "Terraria",
  "Fall Guys"
];

const ROLES = [
  {
    name: "Kurucu",
    color: 0xE74C3C,
    permissions: [PermissionFlagsBits.Administrator]
  },
  {
    name: "Yönetici",
    color: 0xE67E22,
    permissions: [
      PermissionFlagsBits.ManageGuild,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.ViewAuditLog
    ]
  },
  {
    name: "Moderatör",
    color: 0x3498DB,
    permissions: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.ModerateMembers
    ]
  },
  {
    name: "Destek Yetkilisi",
    color: 0x9B59B6,
    permissions: []
  },
  {
    name: "VIP",
    color: 0xF1C40F,
    permissions: []
  },
  {
    name: "Üye",
    color: 0x2ECC71,
    permissions: []
  }
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function embed(title, description, color = 0x5865F2) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function parseCommand(content) {
  const prefix = PREFIXES.find(p =>
    content.toLowerCase().startsWith(p.toLowerCase())
  );

  if (!prefix) return null;

  const rest = content.slice(prefix.length).trim();
  if (!rest) return null;

  const parts = rest.split(/\s+/);

  return {
    command: parts.shift().toLowerCase(),
    args: parts
  };
}

async function getRole(guild, name, options = {}) {
  let role = guild.roles.cache.find(r => r.name === name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color: options.color ?? 0x99AAB5,
      permissions: options.permissions ?? [],
      reason: "TOT otomatik rol sistemi"
    });
  }

  return role;
}

async function getGameRole(guild, name) {
  return getRole(guild, name, {
    color: 0x5865F2,
    permissions: []
  });
}

function registrationPanel() {
  return {
    embeds: [
      embed(
        "🎮 Türkiye Oyun Topluluğu | Kayıt",
        [
          "Sunucumuzda oynadığın oyunu seçerek rolünü alabilirsin.",
          "",
          "🎮 **Kayıt Ol** butonuna tıkla.",
          "📋 Menüden oynadığın oyunu seç.",
          "🔄 Oyununu değiştirirsen önceki oyun rolün kaldırılır.",
          "",
          "Oyun rolleri yönetim yetkisi vermez."
        ].join("\n")
      )
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("tot_register")
          .setLabel("Kayıt Ol")
          .setEmoji("🎮")
          .setStyle(ButtonStyle.Primary)
      )
    ]
  };
}

function gameMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("tot_game_select")
      .setPlaceholder("Oynadığın oyunu seç")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        GAMES.map(game => ({
          label: game,
          value: game,
          description: `${game} rolünü al`
        }))
      )
  );
}

function ticketPanel() {
  return {
    embeds: [
      embed(
        "🎫 Destek Sistemi",
        "Bir konuda yardıma mı ihtiyacın var? Aşağıdaki butona basarak sana özel destek kanalı oluşturabilirsin."
      )
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("tot_ticket_create")
          .setLabel("Destek Talebi Aç")
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Success)
      )
    ]
  };
}

async function createCategory(guild, name, overwrites = []) {
  return guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: overwrites
  });
}

async function createText(guild, name, parent, overwrites = []) {
  return guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: parent.id,
    permissionOverwrites: overwrites
  });
}

async function setupServer(guild) {
  const botMember = guild.members.me;

  if (!botMember) {
    throw new Error("Bot sunucu üyesi olarak bulunamadı.");
  }

  if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
    throw new Error("Botta Kanalları Yönet izni yok.");
  }

  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error("Botta Rolleri Yönet izni yok.");
  }

  // Tüm eski kanalları sil. Roller korunur.
  for (const channel of [...guild.channels.cache.values()]) {
    try {
      await channel.delete("TOT sunucu kurulumu");
      await sleep(250);
    } catch (error) {
      console.error("Kanal silinemedi:", channel.name, error.message);
    }
  }

  // Temel roller
  for (const role of ROLES) {
    await getRole(guild, role.name, role);
  }

  // Oyun rolleri
  for (const game of GAMES) {
    await getGameRole(guild, game);
  }

  const everyone = guild.roles.everyone;

  const staffNames = [
    "Kurucu",
    "Yönetici",
    "Moderatör"
  ];

  const staffRoles = staffNames
    .map(name => guild.roles.cache.find(r => r.name === name))
    .filter(Boolean);

  const supportRole = guild.roles.cache.find(
    r => r.name === "Destek Yetkilisi"
  );

  const publicReadOnly = [
    {
      id: everyone.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory
      ],
      deny: [PermissionFlagsBits.SendMessages]
    }
  ];

  const publicChat = [
    {
      id: everyone.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
      ]
    }
  ];

  const staffOnly = [
    {
      id: everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    ...staffRoles.map(role => ({
      id: role.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    }))
  ];

  const info = await createCategory(
    guild,
    "📌・BİLGİLENDİRME",
    publicReadOnly
  );

  await createText(guild, "📜・kurallar", info, publicReadOnly);
  await createText(guild, "📢・duyurular", info, publicReadOnly);
  await createText(guild, "👋・hoş-geldin", info, publicReadOnly);
  await createText(guild, "📋・sunucu-bilgisi", info, publicReadOnly);

  const community = await createCategory(
    guild,
    "💬・TOPLULUK",
    publicChat
  );

  await createText(guild, "💬・genel-sohbet", community, publicChat);

  const botChannel = await createText(
    guild,
    "🤖・bot-komutları",
    community,
    publicChat
  );

  await createText(guild, "📸・medya", community, publicChat);

  const games = await createCategory(
    guild,
    "🎮・OYUNLAR",
    publicChat
  );

  await createText(guild, "🎮・oyun-sohbeti", games, publicChat);
  await createText(guild, "🧱・minecraft", games, publicChat);
  await createText(guild, "🎯・valorant", games, publicChat);
  await createText(guild, "🚗・gta-v", games, publicChat);
  await createText(guild, "⚽・ea-sports-fc", games, publicChat);
  await createText(guild, "🔫・counter-strike-2", games, publicChat);

  const voice = await createCategory(
    guild,
    "🔊・SES KANALLARI",
    publicChat
  );

  await guild.channels.create({
    name: "🔊・Genel Ses",
    type: ChannelType.GuildVoice,
    parent: voice.id,
    permissionOverwrites: publicChat
  });

  await guild.channels.create({
    name: "🎮・Oyun Odası 1",
    type: ChannelType.GuildVoice,
    parent: voice.id,
    permissionOverwrites: publicChat
  });

  await guild.channels.create({
    name: "🎮・Oyun Odası 2",
    type: ChannelType.GuildVoice,
    parent: voice.id,
    permissionOverwrites: publicChat
  });

  const support = await createCategory(
    guild,
    "🎫・DESTEK",
    [
      {
        id: everyone.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory
        ],
        deny: [PermissionFlagsBits.SendMessages]
      }
    ]
  );

  const supportPanel = await createText(
    guild,
    "🎫・destek-talebi",
    support,
    [
      {
        id: everyone.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory
        ],
        deny: [PermissionFlagsBits.SendMessages]
      }
    ]
  );

  await createText(
    guild,
    "❓・yardım",
    support,
    publicChat
  );

  const management = await createCategory(
    guild,
    "🔒・YÖNETİM",
    staffOnly
  );

  await createText(guild, "🔒・yetkili-sohbet", management, staffOnly);
  await createText(guild, "📋・yetkili-duyuru", management, staffOnly);
  await createText(guild, "📜・mod-log", management, staffOnly);

  // Destek yetkilisine destek kategorisini görme izni.
  if (supportRole) {
    await support.permissionOverwrites.edit(supportRole.id, {
      ViewChannel: true,
      ReadMessageHistory: true,
      SendMessages: true
    });
  }

  // Panel mesajları
  await botChannel.send(registrationPanel());
  await supportPanel.send(ticketPanel());
}

client.once("ready", () => {
  console.log(`${client.user.tag} aktif!`);

  client.user.setActivity("Türkiye Oyun Topluluğu", {
    type: 3
  });
});

client.on("guildMemberAdd", async member => {
  try {
    const role = member.guild.roles.cache.find(r => r.name === "Üye");

    if (role) {
      await member.roles.add(role);
    }
  } catch (error) {
    console.error("Üye rolü verilemedi:", error);
  }
});

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const parsed = parseCommand(message.content);
  if (!parsed) return;

  const { command, args } = parsed;
  const guild = message.guild;

  try {
    if (command === "kayıtpanel") {
      if (args[0]?.toLowerCase() !== "aç") {
        return message.reply("Kullanım: `.kayıtpanel aç`");
      }

      return message.channel.send(registrationPanel());
    }

    if (command === "destekpanel") {
      if (args[0]?.toLowerCase() !== "aç") {
        return message.reply("Kullanım: `.destekpanel aç`");
      }

      return message.channel.send(ticketPanel());
    }

    if (command === "sunucubilgi") {
      const owner = await guild.fetchOwner();

      const textChannels = guild.channels.cache.filter(
        c => c.type === ChannelType.GuildText
      ).size;

      const voiceChannels = guild.channels.cache.filter(
        c => c.type === ChannelType.GuildVoice
      ).size;

      const categories = guild.channels.cache.filter(
        c => c.type === ChannelType.GuildCategory
      ).size;

      return message.reply({
        embeds: [
          embed(
            `📊 ${guild.name} | Sunucu Bilgisi`,
            [
              `**Kurucu:** ${owner.user.tag}`,
              `**Üye:** ${guild.memberCount}`,
              `**Rol:** ${guild.roles.cache.size}`,
              `**Metin kanalı:** ${textChannels}`,
              `**Ses kanalı:** ${voiceChannels}`,
              `**Kategori:** ${categories}`,
              `**Kuruluş:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
              `**Sunucu ID:** ${guild.id}`
            ].join("\n")
          )
        ]
      });
    }

    if (command === "sunucukur") {
      if (message.author.id !== guild.ownerId) {
        return message.reply(
          "⛔ Bu komutu yalnızca sunucu sahibi kullanabilir."
        );
      }

      const botMember = guild.members.me;

      if (
        !botMember ||
        !botMember.permissions.has(PermissionFlagsBits.ManageChannels) ||
        !botMember.permissions.has(PermissionFlagsBits.ManageRoles)
      ) {
        return message.reply(
          "Botta Kanalları Yönet ve Rolleri Yönet izinleri bulunmalı."
        );
      }

      const confirm = await message.channel.send({
        embeds: [
          embed(
            "⚠️ Sunucu Kurulumu",
            "Bu işlem **sunucudaki bütün kanalları ve kategorileri siler**. Roller silinmez.\n\nDevam etmek için 30 saniye içinde `ONAYLA` yaz."
          )
        ]
      });

      const collected = await message.channel.awaitMessages({
        filter: m =>
          m.author.id === message.author.id &&
          m.content.trim().toUpperCase() === "ONAYLA",
        max: 1,
        time: 30000
      });

      if (!collected.size) {
        return confirm.edit({
          embeds: [
            embed("İptal edildi", "Sunucu kurulumu başlatılmadı.")
          ]
        }).catch(() => {});
      }

      // Kurulum sırasında eski komut kanalı silinebilir.
      await confirm.edit({
        embeds: [
          embed(
            "⏳ Kurulum başladı",
            "Kanallar siliniyor, roller ve izinler oluşturuluyor."
          )
        ]
      }).catch(() => {});

      await setupServer(guild);

      const infoChannel = guild.channels.cache.find(
        c => c.name === "📋・sunucu-bilgisi"
      );

      if (infoChannel) {
        await infoChannel.send({
          embeds: [
            embed(
              "✅ Kurulum tamamlandı",
              "Kanallar, roller ve izinler oluşturuldu. Kayıt ve destek panelleri hazır."
            )
          ]
        });
      }

      return;
    }

  } catch (error) {
    console.error(error);

    message.channel.send(
      "❌ İşlem sırasında hata oluştu. Bot izinlerini ve rol sıralamasını kontrol et."
    ).catch(() => {});
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.guild) return;

  try {
    if (
      interaction.isButton() &&
      interaction.customId === "tot_register"
    ) {
      return interaction.reply({
        content: "🎮 Oynadığın oyunu seç:",
        components: [gameMenu()],
        ephemeral: true
      });
    }

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "tot_game_select"
    ) {
      const game = interaction.values[0];

      if (!GAMES.includes(game)) {
        return interaction.reply({
          content: "Geçersiz oyun seçimi.",
          ephemeral: true
        });
      }

      const member = interaction.member;

      const oldRoles = member.roles.cache.filter(role =>
        GAMES.includes(role.name) && role.name !== game
      );

      if (oldRoles.size) {
        await member.roles.remove(oldRoles);
      }

      const role = await getGameRole(interaction.guild, game);

      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role);
      }

      return interaction.update({
        content: `✅ **${game}** rolünü aldın!`,
        components: []
      });
    }

    if (
      interaction.isButton() &&
      interaction.customId === "tot_ticket_create"
    ) {
      const guild = interaction.guild;
      const member = interaction.member;

      const existing = guild.channels.cache.find(
        c =>
          c.type === ChannelType.GuildText &&
          c.topic === `tot-ticket:${member.id}`
      );

      if (existing) {
        return interaction.reply({
          content: `Zaten açık bir destek talebin var: ${existing}`,
          ephemeral: true
        });
      }

      const category = guild.channels.cache.find(
        c =>
          c.type === ChannelType.GuildCategory &&
          c.name === "🎫・DESTEK"
      );

      if (!category) {
        return interaction.reply({
          content: "Destek kategorisi bulunamadı. Sunucu kurulumu yap.",
          ephemeral: true
        });
      }

      const supportRole = guild.roles.cache.find(
        r => r.name === "Destek Yetkilisi"
      );

      const overwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        }
      ];

      if (supportRole) {
        overwrites.push({
          id: supportRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        });
      }

      const ticket = await guild.channels.create({
        name: `destek-${member.user.username}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .slice(0, 90),
        type: ChannelType.GuildText,
        parent: category.id,
        topic: `tot-ticket:${member.id}`,
        permissionOverwrites: overwrites
      });

      await ticket.send({
        content: `${member} <@&${supportRole?.id ?? ""}>`,
        embeds: [
          embed(
            "🎫 Destek Talebin",
            "Destek talebin oluşturuldu. Sorununu burada anlatabilirsin."
          )
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("tot_ticket_close")
              .setLabel("Talebi Kapat")
              .setEmoji("🔒")
              .setStyle(ButtonStyle.Danger)
          )
        ]
      });

      return interaction.reply({
        content: `Destek talebin oluşturuldu: ${ticket}`,
        ephemeral: true
      });
    }

    if (
      interaction.isButton() &&
      interaction.customId === "tot_ticket_close"
    ) {
      const channel = interaction.channel;

      if (
        !channel ||
        !channel.topic?.startsWith("tot-ticket:")
      ) {
        return interaction.reply({
          content: "Bu kanal bir destek talebi değil.",
          ephemeral: true
        });
      }

      const ticketOwnerId = channel.topic.split(":")[1];
      const isOwner = interaction.user.id === ticketOwnerId;
      const isStaff = interaction.member.roles.cache.some(role =>
        ["Kurucu", "Yönetici", "Moderatör", "Destek Yetkilisi"]
          .includes(role.name)
      );

      if (!isOwner && !isStaff) {
        return interaction.reply({
          content: "Bu destek talebini kapatma yetkin yok.",
          ephemeral: true
        });
      }

      await interaction.reply({
        content: "🔒 Destek talebi kapatılıyor..."
      });

      await sleep(1500);
      return channel.delete("Destek talebi kapatıldı");
    }

  } catch (error) {
    console.error("Etkileşim hatası:", error);

    const response = {
      content: "❌ İşlem başarısız. Bot izinlerini ve rol sıralamasını kontrol et.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response).catch(() => {});
    } else {
      await interaction.reply(response).catch(() => {});
    }
  }
});

if (!TOKEN) {
  console.error(
    "DISCORD_TOKEN bulunamadı. Railway Variables bölümüne ekle."
  );
  process.exit(1);
}

client.login(TOKEN);
