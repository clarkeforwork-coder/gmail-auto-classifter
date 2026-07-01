/**
 * Gmail Auto Classifier
 *
 * How to use:
 * 1. Create a Google Apps Script project.
 * 2. Paste this file into Code.gs.
 * 3. Enable the advanced Gmail API service if you want native Gmail filters.
 * 4. Run setupGmailAutoClassifier().
 *
 * The script never deletes messages.
 * Archive means "remove from Inbox, keep in All Mail and labels".
 */

const USER_ID = 'me';

const CONFIG = {
  HOURLY_SWEEP_DAYS: 2,
  BACKFILL_DAYS: 7,
  MAX_THREADS_PER_RULE: 75,

  // Keep this false at first. If true, all Gmail "Promotions" category mail
  // will be labeled Purchases/Promotions and skipped from Inbox.
  ENABLE_PROMOTIONS_CATCH_ALL: false
};

const LABEL_NAMES = [
  '00_Action',
  '00_Action/Review',
  '00_Action/Waiting',
  'Account & Security',
  'Finance',
  'Finance/Bills',
  'Finance/Receipts',
  'Finance/Investment',
  'Finance/Insurance',
  'Career',
  'Travel',
  'Learning',
  'Learning/Tech',
  'Learning/Business',
  'Learning/Reading',
  'Purchases',
  'Purchases/Orders',
  'Purchases/Promotions',
  'Subscriptions',
  'Personal',
  'Work'
];

const RULES = [
  {
    name: 'Account security - major accounts',
    labels: ['Account & Security'],
    archive: false,
    queries: [
      'from:no-reply@accounts.google.com',
      'from:no-reply@signin.aws',
      'from:no-reply@login.awsapps.com',
      'from:no-reply@amazonaws.com subject:"AWS台灣"',
      'from:appleid@apple.com',
      'from:noreply@email.apple.com subject:尋找',
      'from:noreply@email.apple.com subject:"隱藏電子郵件地址"',
      'from:security@mail.instagram.com',
      'from:security@facebookmail.com',
      'from:account-update@amazon.com',
      'from:notify@updates.notion.so',
      'from:noreply@x.ai',
      'from:info@account.netflix.com',
      'from:no-reply@accounts.nintendo.com',
      'from:account@nvidia.com',
      'from:sa.noreply@samsung-mail.com',
      'from:no-reply@grab.com',
      'from:noreply@gotinder.com',
      'from:no-reply@id.smartbear.com',
      'from:no-reply@goodnotes.com',
      'from:no-reply-2Mao_jH0pR8lAPC_txXuCw@mail.anthropic.com'
    ]
  },
  {
    name: 'Account security - games and apps',
    labels: ['Account & Security'],
    archive: false,
    queries: [
      'from:help@developers.epicgames.com',
      'from:help@acct.epicgames.com subject:"Security Code"',
      'from:help@acct.epicgames.com subject:"two-factor"',
      'from:help@acct.epicgames.com subject:"Password"',
      'from:do_not_reply@mgdirectmail.binance.com',
      'from:do-not-reply@ses.binance.com',
      'from:updates@account.ubisoft.com',
      'from:noreply@tsmc.com',
      'from:support@mai-mai.com.tw',
      'from:no-reply@spotify.com subject:方案',
      'from:ossindex@sonatype.org',
      'from:noreply@reddit.com subject:password'
    ]
  },
  {
    name: 'Account security - insurance and travel accounts',
    labels: ['Account & Security'],
    archive: false,
    queries: [
      'from:noreply@account.hkexpress.com',
      'from:memberservices@email.cathaypacific.com',
      'from:member.ins@fubonins.com.tw',
      'from:no-reply@e-news.vietnamairlines.com'
    ]
  },
  {
    name: 'Action review',
    labels: ['00_Action/Review'],
    archive: false,
    queries: [
      'from:drive-shares-dm-noreply@google.com',
      'from:firebase-noreply@google.com',
      'from:noreply@github.com subject:invited',
      'from:notifications@github.com subject:"Run failed"',
      'from:ship@info.vercel.com subject:Security',
      'from:logitech@messaging.logitech.com',
      'from:ithelp@mail.member-mail.ithome.com.tw',
      'from:noreply-cloud@google.com',
      'from:clarkeforai@gmail.com subject:"共用日曆"',
      'from:no-reply@oen-mails.tw'
    ]
  },
  {
    name: 'Action waiting',
    labels: ['00_Action/Waiting'],
    archive: false,
    queries: [
      'from:daphne@mail.ithome.com.tw'
    ]
  },
  {
    name: 'Work',
    labels: ['Work'],
    archive: false,
    queries: [
      'from:notify@mail.notion.so',
      'from:notifications@github.com',
      'from:noreply@github.com subject:invited',
      'from:noreply-cloud@google.com',
      'from:clarkeforai@gmail.com subject:"共用日曆"',
      'from:00595779@cathaylife.com.tw subject:報支'
    ]
  },
  {
    name: 'Finance bills',
    labels: ['Finance/Bills'],
    archive: true,
    queries: [
      'from:estatement@esunbank.com',
      'from:eservicetw@dbs.com',
      'from:csr@ebank-statement.feib.com.tw',
      'from:service@enotice.entiebank.com.tw',
      'from:payments-noreply@google.com subject:"Google Cloud Platform"'
    ]
  },
  {
    name: 'Finance receipts',
    labels: ['Finance/Receipts'],
    archive: true,
    queries: [
      'from:info-inv@ezpay.com.tw',
      'from:sys@ns1.ecpay.com.tw',
      'from:no_reply@email.apple.com subject:收據',
      'from:no_reply@email.apple.com subject:開立發票',
      'from:no_reply@email.apple.com subject:退款',
      'from:noreply@tax.openai.com',
      'from:eticket@thsrc.com.tw',
      'from:noreply@uberegui.com',
      'from:info@newebpay.com',
      'from:b2b2c@mail.ebilling.com.tw',
      'from:noreply@kobo.com',
      'from:stripe.com subject:receipt',
      'from:stripe.com subject:invoice',
      'from:systex-giftshop@ebpp.com.tw',
      'from:help@acct.epicgames.com subject:Receipt',
      'from:no-reply@kkday.com subject:收據',
      'from:no-reply@kkday.com subject:款項',
      'from:noreply@fontrip.com.tw',
      'from:eticket@amadeus.com'
    ]
  },
  {
    name: 'Finance investment',
    labels: ['Finance/Investment'],
    archive: true,
    queries: [
      'from:esunsec-service@omi.esunsec.com.tw',
      'from:enotice@bhu.tdcc.com.tw',
      'from:enotice@mhu.tdcc.com.tw',
      'from:goodwhale@withwind.tw',
      'from:goodwhale@myteachify.com',
      'from:web@mg.macromicro.me',
      'from:Service@msg.esunbank.com',
      'from:btschool@myteachify.com'
    ]
  },
  {
    name: 'Finance insurance',
    labels: ['Finance/Insurance'],
    archive: true,
    queries: [
      'from:fgis.ins@bill.fubon.com.tw',
      'from:ec.ins@fubonins.com.tw',
      'from:ITSERVICE@allianz.com.tw'
    ]
  },
  {
    name: 'Learning tech',
    labels: ['Learning/Tech'],
    archive: true,
    queries: [
      'from:admin@angular-university.io',
      'from:no-reply@t.mail.coursera.org',
      'from:no-reply@hiskio.com',
      'from:googlecloud@google.com',
      'from:googledev-noreply@google.com',
      'from:hack@encode.club',
      'from:noreply@kaggle.com',
      'from:azure@email.microsoft.com',
      'from:systemdesignone@substack.com',
      'from:arcnotes+newsletter@substack.com',
      'from:refactoring@substack.com',
      'from:aws-marketing-email-replies@amazon.com',
      'from:do-not-reply@certmetrics.com',
      'from:PearsonVUEConfirmation@e.pearson.com',
      'from:calendar-notification@google.com subject:"Pearson VUE"',
      'from:support@examtopics.com',
      'from:noreply@examtopics.com',
      'from:english-quora-digest@quora.com',
      'from:googlecommunityteam-noreply@google.com',
      'from:katechuang@xwf.google.com',
      'from:zheng@redhat.com',
      'from:ArielChu@uuu.com.tw'
    ]
  },
  {
    name: 'Learning tech but keep visible',
    labels: ['Learning/Tech'],
    archive: false,
    queries: [
      'from:ship@info.vercel.com subject:Security',
      'from:ithelp@mail.member-mail.ithome.com.tw',
      'from:ossindex@sonatype.org'
    ]
  },
  {
    name: 'Learning business',
    labels: ['Learning/Business'],
    archive: true,
    queries: [
      'from:bigtechnology@substack.com',
      'from:peteryang+product-life-lessons@substack.com',
      'from:hello@surveycake.com',
      'from:hello@pressplay.cc',
      'from:info@lioshutan.com',
      'from:rboffice01@nkust.edu.tw'
    ]
  },
  {
    name: 'Learning reading',
    labels: ['Learning/Reading'],
    archive: true,
    queries: [
      'from:wakichuang@readingoutpost.com',
      'from:economist@cw.com.tw',
      'from:hello@e.faithera.com',
      'from:customer@faithera.com'
    ]
  },
  {
    name: 'Career - keep visible',
    labels: ['Career'],
    archive: false,
    queries: [
      'from:aijessie88@step1ne.com',
      'from:messaging-digest-noreply@linkedin.com'
    ]
  },
  {
    name: 'Career - archive newsletters and old process mail',
    labels: ['Career'],
    archive: true,
    queries: [
      'from:notifications@no-reply.cake.me',
      'from:noreply@mail.amazon.jobs',
      'from:no-reply@indeed.com',
      'from:jobs-listings@linkedin.com',
      'from:messages-noreply@linkedin.com',
      'from:Carol.Chen@adecco.com',
      'from:Gina.Chen@dellteam.com',
      'from:Joy.Zhang2@dellteam.com',
      'from:jade@recruiting.dell.com',
      'from:jade@paradox.ai',
      'from:jade1@paradox.ai',
      'from:noreply@dell.com',
      'from:thementorshiptaiwan@gmail.com',
      'from:noreply@yourator.co',
      'from:australiagoodday2@gmail.com',
      'from:calendar-notification@google.com subject:"曼陀號"'
    ]
  },
  {
    name: 'Travel - keep visible',
    labels: ['Travel'],
    archive: false,
    queries: [
      'from:noreply@account.hkexpress.com',
      'from:memberservices@email.cathaypacific.com',
      'from:no-reply@e-news.vietnamairlines.com',
      'from:no-reply@kkday.com',
      'from:support-noreply@klook.com',
      'from:noreply@booking.com'
    ]
  },
  {
    name: 'Travel - archive old notices',
    labels: ['Travel'],
    archive: true,
    queries: [
      'from:eticket@thsrc.com.tw',
      'from:notifications@agoda-messaging.com',
      'from:DynastyFlyer@china-airlines.com',
      'from:ecsi@china-airlines.com',
      'from:cal-notice@china-airlines.com',
      'from:calmarketing@email-china-airlines.com',
      'from:eticket@amadeus.com',
      'from:cal-reservation@amadeus.com',
      'from:noreply@fontrip.com.tw',
      'from:calendar-notification@google.com subject:Flight',
      'from:no-reply@uber.com subject:預約'
    ]
  },
  {
    name: 'Purchases orders - keep visible',
    labels: ['Purchases/Orders'],
    archive: false,
    queries: [
      'from:support@pinkoi.zendesk.com',
      'from:support@mai-mai.com.tw',
      'from:no-reply@oen-mails.tw'
    ]
  },
  {
    name: 'Purchases orders - archive confirmations',
    labels: ['Purchases/Orders'],
    archive: true,
    queries: [
      'from:orders@shopline.com',
      'from:notify@bvshop.tw',
      'from:ezbuy@tenlong.com.tw',
      'from:noreply@kobo.com',
      'from:marketplace@mail.notion.so',
      'from:reply@txn-email.playstation.com',
      'from:info@mail.foodpanda.com.tw',
      'from:customer@faithera.com',
      'from:systex-giftshop@ebpp.com.tw'
    ]
  },
  {
    name: 'Purchases promotions',
    labels: ['Purchases/Promotions'],
    archive: true,
    queries: [
      'from:edm@momo.com.tw',
      'from:uber.taiwan@uber.com',
      'from:service@books.com.tw',
      'from:MemberService_no-reply@account.asus.com',
      'from:voice-nintendo-noreply@ccg.nintendo.com',
      'from:OnlineResearch@insideapple.apple.com',
      'from:noreply@cyberbiz.co',
      'from:gazette@larian.com',
      'from:no-reply@spotify.com subject:優惠',
      'from:no-reply@spotify.com subject:Premium'
    ]
  },
  {
    name: 'Subscriptions',
    labels: ['Subscriptions'],
    archive: true,
    queries: [
      'from:message@adobe.com',
      'from:store@adobe.com',
      'from:no-reply@canva.com subject:"Canva Pro"',
      'from:billing-noreply@linkedin.com',
      'from:upcoming-invoice+acct_1RJ9w6FtDiYUT6Fo@stripe.com',
      'from:help@acct.epicgames.com subject:"Terms of Service"',
      'from:advertise-noreply@support.facebook.com',
      'from:alerts@ifttt.com',
      'from:noreply@te.battle.net',
      'from:noreply@umail.accounts.riotgames.com',
      'from:noreply@mail.accounts.riotgames.com'
    ]
  },
  {
    name: 'Personal',
    labels: ['Personal'],
    archive: true,
    queries: [
      'from:results@types.learntocode.com.tw',
      'from:info@inline.tw',
      'from:google-maps-noreply@google.com'
    ]
  },
  {
    name: 'Optional Gmail promotions catch-all',
    labels: ['Purchases/Promotions'],
    archive: true,
    disabled: !CONFIG.ENABLE_PROMOTIONS_CATCH_ALL,
    queries: [
      'category:promotions'
    ]
  }
];

function setupGmailAutoClassifier() {
  ensureLabels_();
  try {
    createNativeFilters_();
  } catch (err) {
    Logger.log('Native Gmail filters were not created: ' + err.message);
    Logger.log('Enable Advanced Google Services > Gmail API, then run setupGmailAutoClassifier() again.');
  }
  installHourlySweep();
  Logger.log('Setup complete. Hourly sweep installed.');
}

function createNativeFilters_() {
  if (typeof Gmail === 'undefined') {
    throw new Error('Advanced Gmail service is not enabled in Apps Script.');
  }

  const labelIdByName = getLabelIdByName_();
  const existing = Gmail.Users.Settings.Filters.list(USER_ID).filter || [];
  const existingKeys = {};
  existing.forEach(function(filter) {
    existingKeys[filterKey_(filter)] = true;
  });

  let created = 0;
  activeRules_().forEach(function(rule) {
    const labelIds = expandLabelNames_(rule.labels).map(function(name) {
      return labelIdByName[name];
    }).filter(Boolean);

    rule.queries.forEach(function(query) {
      const resource = {
        criteria: { query: query },
        action: { addLabelIds: labelIds }
      };
      if (rule.archive) {
        resource.action.removeLabelIds = ['INBOX'];
      }

      const key = filterKey_(resource);
      if (!existingKeys[key]) {
        try {
          Gmail.Users.Settings.Filters.create(resource, USER_ID);
          existingKeys[key] = true;
          created += 1;
        } catch (err) {
          Logger.log('Failed to create filter [' + rule.name + '] query=[' + query + ']: ' + err.message);
        }
      }
    });
  });

  Logger.log('Created native filters: ' + created);
}

function runHourlyClassifier() {
  classifyRecentInbox_(CONFIG.HOURLY_SWEEP_DAYS);
}

function runBackfill7Days() {
  classifyRecentInbox_(CONFIG.BACKFILL_DAYS);
}

function runBackfill30Days() {
  classifyRecentInbox_(30);
}

function classifyRecentInbox_(days) {
  ensureLabels_();
  const labelByName = getGmailAppLabelByName_();
  let touchedThreads = 0;

  activeRules_().forEach(function(rule) {
    rule.queries.forEach(function(query) {
      const searchQuery = 'newer_than:' + days + 'd in:inbox -in:spam -in:trash ' + query;
      let threads = [];
      try {
        threads = GmailApp.search(searchQuery, 0, CONFIG.MAX_THREADS_PER_RULE);
      } catch (err) {
        Logger.log('Search failed [' + rule.name + '] query=[' + searchQuery + ']: ' + err.message);
        return;
      }

      if (!threads.length) {
        return;
      }

      expandLabelNames_(rule.labels).forEach(function(labelName) {
        labelByName[labelName].addToThreads(threads);
      });

      if (rule.archive) {
        GmailApp.moveThreadsToArchive(threads);
      }

      touchedThreads += threads.length;
    });
  });

  Logger.log('Classified recent inbox threads: ' + touchedThreads);
}

function installHourlySweep() {
  deleteTriggersFor_('runHourlyClassifier');
  ScriptApp.newTrigger('runHourlyClassifier')
    .timeBased()
    .everyHours(1)
    .create();
}

function deleteClassifierTriggers() {
  deleteTriggersFor_('runHourlyClassifier');
}

function ensureLabels_() {
  LABEL_NAMES.forEach(function(name) {
    if (!GmailApp.getUserLabelByName(name)) {
      GmailApp.createLabel(name);
    }
  });
}

function getGmailAppLabelByName_() {
  const result = {};
  LABEL_NAMES.forEach(function(name) {
    result[name] = GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
  });
  return result;
}

function getLabelIdByName_() {
  const labels = Gmail.Users.Labels.list(USER_ID).labels || [];
  const result = {};
  labels.forEach(function(label) {
    result[label.name] = label.id;
  });
  return result;
}

function expandLabelNames_(labelNames) {
  const out = {};
  labelNames.forEach(function(name) {
    out[name] = true;
    if (name.indexOf('00_Action/') === 0) out['00_Action'] = true;
    if (name.indexOf('Finance/') === 0) out['Finance'] = true;
    if (name.indexOf('Learning/') === 0) out['Learning'] = true;
    if (name.indexOf('Purchases/') === 0) out['Purchases'] = true;
  });
  return Object.keys(out);
}

function activeRules_() {
  return RULES.filter(function(rule) {
    return !rule.disabled;
  });
}

function deleteTriggersFor_(handlerName) {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === handlerName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function filterKey_(filter) {
  const criteria = filter.criteria || {};
  const action = filter.action || {};
  return JSON.stringify({
    query: criteria.query || '',
    add: (action.addLabelIds || []).slice().sort(),
    remove: (action.removeLabelIds || []).slice().sort()
  });
}
