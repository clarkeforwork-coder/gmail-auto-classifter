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
  MAX_THREADS_PER_LABEL_ARCHIVE: 100,
  MAX_LABEL_ARCHIVE_BATCHES: 10,

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

const ARCHIVE_EXISTING_LABELS = [
  'Finance',
  'Finance/Bills',
  'Finance/Receipts',
  'Finance/Investment',
  'Finance/Insurance',
  'Learning/Business',
  'Learning/Reading',
  'Purchases/Promotions',
  'Subscriptions',
  'Personal'
];

const SOURCE_LABEL_NAMES_TO_REMOVE = [
  '最新快訊'
];

// Gmail UI may show this system category as "最新快訊".
const SOURCE_SYSTEM_LABEL_IDS_TO_REMOVE = [
  'CATEGORY_UPDATES'
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
      'from:appleid@id.apple.com',
      'from:noreply@email.apple.com subject:iCloud',
      'from:noreply@email.apple.com subject:尋找',
      'from:noreply@email.apple.com subject:"播放聲音"',
      'from:noreply@email.apple.com subject:"隱藏電子郵件地址"',
      'from:security@mail.instagram.com',
      'from:security@facebookmail.com',
      'from:noreply-maps-timeline@google.com',
      'from:noreply@github.com subject:"OAuth application"',
      'from:noreply@github.com subject:"GitHub Application"',
      'from:noreply@github.com subject:"GitHub owned Application"',
      'from:no-reply@notify.docker.com',
      'from:gitlab@mg.gitlab.com subject:"Confirm your email address"',
      'from:noreply@nexon.com',
      'from:shoppingsc@pchome.com.tw subject:"成功登入"',
      'from:service@books.com.tw subject:登入',
      'from:service@books.com.tw subject:密碼',
      'from:service@books.com.tw subject:帳號',
      'from:account-update@amazon.com',
      'from:notify@updates.notion.so',
      'from:noreply@x.ai',
      'from:info@account.netflix.com',
      'from:no-reply@accounts.nintendo.com',
      'from:account@nvidia.com',
      'from:noreply@amazon.com subject:"Action Required"',
      'from:sa.noreply@samsung-mail.com',
      'from:account-update@imdb.com subject:"Sign-in"',
      'from:no-reply@grab.com',
      'from:noreply@gotinder.com',
      'from:no-reply@id.smartbear.com',
      'from:no-reply@goodnotes.com',
      'from:no-reply-2Mao_jH0pR8lAPC_txXuCw@mail.anthropic.com',
      'from:mail.anthropic.com subject:"Secure link to log in"',
      'from:no-reply@auth.myunidays.com',
      'from:no-reply@samsungcloud.com',
      'from:verification@verify.snapchat.com',
      'from:no-reply@cognition.ai',
      'from:contact@serpapi.com',
      'from:no-reply@serpapi.com',
      'from:hello@info.n8n.io subject:"license key"',
      'from:noreply@my.games',
      'from:no_reply@jetbrains.com',
      'from:isafe.osha@ms2ap.osha.gov.tw',
      'from:KLM@klm-info.com subject:"personal data"',
      'from:ESUNCARD@email.esunbank.com.tw subject:"重新註冊"',
      'from:no-reply@pitch.com subject:"temporary Pitch log-in code"',
      'from:security-noreply@linkedin.com',
      'from:no-reply@todoist.com subject:"刪除帳戶"'
    ]
  },
  {
    name: 'Account security - games and apps',
    labels: ['Account & Security'],
    archive: false,
    queries: [
      'from:help@developers.epicgames.com',
      'from:help@acct.epicgames.com subject:"Security Code"',
      'from:help@acct.epicgames.com subject:"Security Alert"',
      'from:help@acct.epicgames.com subject:"two-factor"',
      'from:help@acct.epicgames.com subject:"Password"',
      'from:do_not_reply@mgdirectmail.binance.com',
      'from:do-not-reply@ses.binance.com',
      'from:updates@account.ubisoft.com',
      'from:account-security-noreply@accountprotection.microsoft.com',
      'from:noreply@tsmc.com',
      'from:support@mai-mai.com.tw',
      'from:no-reply@spotify.com subject:方案',
      'from:ossindex@sonatype.org',
      'from:noreply@reddit.com subject:password',
      'from:do-not-reply-here@imdb.com',
      'from:beanfun@beanfun.com',
      'from:member@tw.service.beanfun.com',
      'from:playrohan@playrohan.com',
      'from:sony@txn-email03.playstation.com subject:"已新增為已授權的應用程式"',
      'from:noreply@mail.accounts.riotgames.com subject:登入代碼',
      'from:noreply@umail.accounts.riotgames.com subject:驗證',
      'from:no-reply@tigerairtw.com subject:驗證碼',
      'from:no-reply@west-qr.com subject:驗證碼',
      'from:twmmembercenter@taiwanmobile.com subject:登入通知',
      'from:twmmembercenter@taiwanmobile.com subject:"E-mail帳號確認"'
    ]
  },
  {
    name: 'Account security - insurance and travel accounts',
    labels: ['Account & Security'],
    archive: false,
    queries: [
      'from:noreply@account.hkexpress.com',
      'from:memberservices@email.cathaypacific.com',
      'from:memberservices@cathaypacific.com',
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
      'from:notifications@github.com subject:"requested your review"',
      'from:notifications@github.com subject:"Review requested"',
      'from:notifications@github.com subject:"Run failed"',
      'from:ship@info.vercel.com subject:Security',
      'from:support@figma.com subject:"You can now view"',
      'from:no-reply@email.figma.com subject:invited',
      'from:logitech@messaging.logitech.com',
      'from:ithelp@mail.member-mail.ithome.com.tw',
      'from:noreply-cloud@google.com',
      'from:CloudPlatform-noreply@google.com subject:BigQuery',
      'from:CloudPlatform-noreply@google.com subject:"default SQL dialect"',
      'from:CloudPlatform-noreply@google.com subject:"Gemini for Google Cloud"',
      'from:no-reply@paymonade.tech subject:"Action Required"',
      'from:no-reply@sns.amazonaws.com subject:"Subscription Confirmation"',
      'from:NotebookLM-noreply@google.com subject:"shared with you"',
      'from:gitlab@mg.gitlab.com subject:"Access to"',
      'from:do-not-reply@trello.com',
      'from:mailer@jobleads.com',
      'from:messaging-digest-noreply@linkedin.com',
      'from:clarkeforai@gmail.com subject:"共用日曆"',
      'from:no-reply@oen-mails.tw',
      'from:mailer-daemon@googlemail.com subject:"Delivery Status Notification"',
      'from:no-reply@agoda.com subject:"完成付款"',
      'from:customerservice@agoda.com subject:"取消訂單"'
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
      'from:noreply@vidcast.io',
      'from:noreply@github.com subject:invited',
      'from:noreply@github.com subject:"made you an owner"',
      'from:noreply@github.com subject:"Repository transfer"',
      'from:noreply-cloud@google.com',
      'from:drive-shares-dm-noreply@google.com',
      'from:CloudPlatform-noreply@google.com subject:BigQuery',
      'from:CloudPlatform-noreply@google.com subject:"default SQL dialect"',
      'from:CloudPlatform-noreply@google.com subject:"Gemini for Google Cloud"',
      'from:support@figma.com subject:"You can now view"',
      'from:no-reply@pitch.com subject:"invited to a Pitch presentation"',
      'from:no-reply@email.figma.com subject:invited',
      'from:NotebookLM-noreply@google.com subject:"shared with you"',
      'from:gitlab@mg.gitlab.com subject:"Access to"',
      'from:do-not-reply@trello.com',
      'from:calendar-notification@google.com subject:"後續流程"',
      'from:calendar-notification@google.com subject:"協助專案說明"',
      'from:00595779@cathaylife.com.tw subject:"Scan Data"',
      'from:00595779@cathaylife.com.tw subject:"共用"',
      'from:clarkeforai@gmail.com subject:"共用日曆"',
      'from:00595779@cathaylife.com.tw subject:報支'
    ]
  },
  {
    name: 'Finance bills - keep visible',
    labels: ['Finance/Bills', '00_Action/Review'],
    archive: false,
    queries: [
      'from:ebill@ebsmtp01.taiwanmobile.com subject:繳款提醒'
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
      'from:ebill@ebsmtp01.taiwanmobile.com subject:e帳單',
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
      'from:noreply@email.openai.com subject:VAT',
      'from:noreply@email.openai.com subject:營業稅',
      'from:eticket@thsrc.com.tw',
      'from:noreply@uberegui.com',
      'from:info@newebpay.com',
      'from:b2b2c@mail.ebilling.com.tw',
      'from:noreply@kobo.com',
      'from:stripe.com subject:receipt',
      'from:stripe.com subject:invoice',
      'from:stripe.com subject:refund',
      'from:no-reply@hbomax.com subject:Invoice',
      'from:invoice+statements@mail.anthropic.com',
      'from:mail.anthropic.com subject:"Your receipt from Anthropic"',
      'from:TW_invoicing@email.apple.com',
      'from:no_reply@email.apple.com subject:"Invoice Notification"',
      'from:TW_HTL_NoReply@trip.com',
      'from:info@travelinvoice.com.tw',
      'from:automail@b2beivcp.pic.net.tw',
      'from:service@myotgcard.starbucks.com.tw',
      'from:service@e.starbucks.com.tw',
      'from:systex-giftshop@ebpp.com.tw',
      'from:receipt@mail.opentix.life',
      'from:shoppingsc@pchome.com.tw subject:"發票開立通知"',
      'from:einvoice@worldgymtaiwan.com',
      'from:einvoice@einvoice.nat.gov.tw subject:中獎',
      'from:service@books.com.tw subject:發票',
      'from:automated@airbnb.com subject:eGUI',
      'from:automated@airbnb.com subject:"Airbnb 收據"',
      'from:b2ceci@ecimail1.tradevan.com.tw',
      'from:help@acct.epicgames.com subject:Receipt',
      'from:no-reply@kkday.com subject:收據',
      'from:no-reply@kkday.com subject:款項',
      'from:no-reply@agoda.com subject:"Cashback Reward"',
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
      'from:btschool@myteachify.com',
      'from:mailservice.edm001@wantgoo.com',
      'from:blocktrend@substack.com'
    ]
  },
  {
    name: 'Finance insurance',
    labels: ['Finance/Insurance'],
    archive: true,
    queries: [
      'from:fgis.ins@bill.fubon.com.tw',
      'from:ec.ins@fubonins.com.tw',
      'from:payonline@cathay-ins.com.tw',
      'from:ITSERVICE@allianz.com.tw',
      'from:POS@allianz.com.tw'
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
      'from:googlecommunityteam-noreply@google.com',
      'from:NotebookLM-noreply@google.com',
      'from:support@tabnine.com',
      'from:newsletter@newsletter.quizlet.com',
      'from:katechuang@xwf.google.com',
      'from:zheng@redhat.com',
      'from:ArielChu@uuu.com.tw',
      'from:contact@hahow.in',
      'from:productforengineers@substack.com',
      'from:matias@codereader.dev',
      'from:info@mail.gitlab.com',
      'from:volunteer@coscup.org',
      'from:no-reply@amazonaws.com subject:Kiro',
      'from:google-gemini-noreply@google.com',
      'from:rvarma@cursor.com',
      'from:no-reply@aws.training',
      'from:team@kodekloud.com',
      'from:CloudPlatform-noreply@google.com subject:"Cloud Billing user survey"',
      'from:tces@mail.ems.ithome.com.tw',
      'from:cst@mail.ems.ithome.com.tw',
      'from:attendee@coscup.org'
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
      'from:team@learn.mail.monday.com',
      'from:aakashgupta@substack.com',
      'from:info@lioshutan.com',
      'from:rboffice01@nkust.edu.tw',
      'from:MSDyn365@email.microsoft.com',
      'from:JunMoney@f.stanmail.io',
      'from:JunMoney@e.stanmail.io',
      'from:orders@stan.store',
      'from:ms.s_at_web3careercoach_com_kzc4dhcfkr7fmq_66gc1236@icloud.com'
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
      'from:customer@faithera.com',
      'from:jessie@theoutsiderstory.com',
      'from:english-quora-digest@quora.com'
    ]
  },
  {
    name: 'Career - keep visible',
    labels: ['Career'],
    archive: false,
    queries: [
      'from:aijessie88@step1ne.com',
      'from:mailer@jobleads.com',
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
      'from:talentcommunity@asml.com',
      'from:jobs-listings@linkedin.com',
      'from:jobalerts-noreply@linkedin.com',
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
      'from:calendar-notification@google.com subject:"曼陀號"',
      'from:robertchenthepm@substack.com',
      'from:peteryang+ai-track@substack.com',
      'from:ms.s_at_web3careercoach_com_kzc4dhcfkr7fmq_66gc1236@icloud.com'
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
      'from:noreply5.lotusmiles@info.vietnamairlines.com',
      'from:no-reply@kkday.com',
      'from:support-noreply@klook.com',
      'from:customerservice@agoda.com',
      'from:no-reply@agoda.com subject:"完成付款"',
      'from:express@airbnb.com',
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
      'from:automated@airbnb.com',
      'from:contact@backpackers.com.tw',
      'from:calendar-notification@google.com subject:Flight',
      'from:no-reply@uber.com subject:預約',
      'from:no-reply@tigerairtw.com subject:"會員等級"',
      'from:no-reply@agoda.com subject:"Cashback Reward"',
      'from:no-reply@agoda.com subject:"Final Reminder"',
      'from:no-reply@agoda.com subject:recommend',
      'from:no-reply@west-qr.com subject:"註冊完成"',
      'from:TW_HTL_NoReply@trip.com',
      'from:info@travelinvoice.com.tw'
    ]
  },
  {
    name: 'Purchases orders - keep visible',
    labels: ['Purchases/Orders'],
    archive: false,
    queries: [
      'from:support@pinkoi.zendesk.com',
      'from:support@mai-mai.com.tw',
      'from:noreply@studioa.com.tw',
      'from:no-reply@oen-mails.tw',
      'from:service@books.com.tw subject:取貨通知',
      'from:notifications+rpg@mail.easystore.co subject:訂單',
      'from:notifications+rpg@mail.easystore.co subject:出貨'
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
      'from:orders@books.com.tw',
      'from:service@books.com.tw subject:"數位商品"',
      'from:noreply@kobo.com',
      'from:marketplace@mail.notion.so',
      'from:shoppingsc@pchome.com.tw subject:"購買清單"',
      'from:reply@txn-email.playstation.com',
      'from:info@mail.foodpanda.com.tw',
      'from:customer@faithera.com',
      'from:systex-giftshop@ebpp.com.tw',
      'from:no-reply@onewarehouse.net',
      'from:your_order_TW@orders.apple.com',
      'from:shipping_notification_tw@orders.apple.com',
      'from:no-reply@email.apple.com subject:"個人化設定服務"',
      'from:no_reply@email.apple.com subject:"現已推出"'
    ]
  },
  {
    name: 'Purchases promotions',
    labels: ['Purchases/Promotions'],
    archive: true,
    queries: [
      'from:edm@momo.com.tw',
      'from:uber.taiwan@uber.com',
      'from:service@books.com.tw subject:折價券',
      'from:MemberService_no-reply@account.asus.com',
      'from:voice-nintendo-noreply@ccg.nintendo.com',
      'from:OnlineResearch@insideapple.apple.com',
      'from:noreply@cyberbiz.co',
      'from:gazette@larian.com',
      'from:info@members.netflix.com',
      'from:service@mailhunter.cathaylife.com.tw',
      'from:info@havenshop.com',
      'from:no-reply@mail.luup.inc',
      'from:rollstaiwan@rolls.com.tw',
      'from:kevin@crete1.com.tw',
      'from:uniqlo-taiwan@ml.store.uniqlo.com',
      'from:epaper@shinkongmitsukoshi.com.tw',
      'from:info@haku-clothing.com',
      'from:system@91app.com',
      'from:support@buyandship.com.tw',
      'from:info@aholiclaces.com',
      'from:shoppingsc@pchome.com.tw subject:"中獎通知"',
      'from:uber@uber.com',
      'from:sega@email.segaamerica.com',
      'from:no-reply@spotify.com subject:優惠',
      'from:no-reply@spotify.com subject:Premium',
      'from:no-reply@spotify.com subject:新作品',
      'from:no-reply@spotify.com subject:"每週新發現"'
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
      'from:no-reply@deepl.com',
      'from:learn@deepl.com',
      'from:no-reply@legal.spotify.com',
      'from:no-reply@spotify.com subject:"無法處理"',
      'from:no_reply@email.apple.com subject:"訂閱確認"',
      'from:no_reply@email.apple.com subject:續訂',
      'from:no_reply@email.apple.com subject:"訂閱即將到期"',
      'from:info@lioshutan.com subject:"合約即將到期"',
      'from:no-reply@luup.co.jp',
      'from:uber@uber.com subject:"條款"',
      'from:noreply@wemod.com',
      'from:notifications@gamma.app subject:"terms"',
      'from:account@account.quizlet.com subject:"Terms of Service"',
      'from:support@figma.com subject:"Terms of Service"',
      'from:chelsea@ifttt.com',
      'from:notice@email.anthropic.com',
      'from:mail@hi.pitch.com',
      'from:no-reply@youtube.com subject:服務條款',
      'from:mail.anthropic.com subject:"Claude Max subscription was canceled"',
      'from:advertise-noreply@support.facebook.com',
      'from:alerts@ifttt.com',
      'from:noreply@te.battle.net',
      'from:noreply@umail.accounts.riotgames.com subject:"Terms of Service"',
      'from:noreply@umail.accounts.riotgames.com subject:服務條款',
      'from:noreply@mail.accounts.riotgames.com subject:"Terms of Service"',
      'from:noreply@mail.accounts.riotgames.com subject:服務條款'
    ]
  },
  {
    name: 'Personal',
    labels: ['Personal'],
    archive: true,
    queries: [
      'from:results@types.learntocode.com.tw',
      'from:info@inline.tw',
      'from:google-maps-noreply@google.com',
      'from:service@nkust.edu.tw subject:生日'
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
    const removeLabelIds = getFilterRemoveLabelIds_(labelIdByName, rule.archive);

    rule.queries.forEach(function(query) {
      const resource = {
        criteria: { query: query },
        action: { addLabelIds: labelIds }
      };
      if (removeLabelIds.length) {
        resource.action.removeLabelIds = removeLabelIds;
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
  archiveInboxWithArchiveLabels();
}

function runBackfill7Days() {
  classifyRecentInbox_(CONFIG.BACKFILL_DAYS);
  archiveInboxWithArchiveLabels();
}

function runBackfill30Days() {
  classifyRecentInbox_(30);
  archiveInboxWithArchiveLabels();
}

function archiveInboxWithArchiveLabels() {
  ensureLabels_();
  const sourceLabelsToRemove = getGmailAppSourceLabelsToRemove_();
  const sourceSystemLabelIdsToRemove = SOURCE_SYSTEM_LABEL_IDS_TO_REMOVE.slice();
  let archivedThreads = 0;

  ARCHIVE_EXISTING_LABELS.forEach(function(labelName) {
    const searchQuery = 'in:inbox -in:spam -in:trash label:' + quoteSearchValue_(labelName);

    for (let batch = 0; batch < CONFIG.MAX_LABEL_ARCHIVE_BATCHES; batch += 1) {
      let threads = [];
      try {
        threads = GmailApp.search(searchQuery, 0, CONFIG.MAX_THREADS_PER_LABEL_ARCHIVE);
      } catch (err) {
        Logger.log('Archive-by-label search failed label=[' + labelName + '] query=[' + searchQuery + ']: ' + err.message);
        return;
      }

      if (!threads.length) {
        break;
      }

      GmailApp.moveThreadsToArchive(threads);
      removeLabelsFromThreads_(sourceLabelsToRemove, threads);
      removeSystemLabelIdsFromThreads_(sourceSystemLabelIdsToRemove, threads);
      archivedThreads += threads.length;

      if (threads.length < CONFIG.MAX_THREADS_PER_LABEL_ARCHIVE) {
        break;
      }
    }
  });

  Logger.log('Archived inbox threads with archive labels: ' + archivedThreads);
}

function classifyRecentInbox_(days) {
  ensureLabels_();
  const labelByName = getGmailAppLabelByName_();
  const sourceLabelsToRemove = getGmailAppSourceLabelsToRemove_();
  const sourceSystemLabelIdsToRemove = SOURCE_SYSTEM_LABEL_IDS_TO_REMOVE.slice();
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

      removeLabelsFromThreads_(sourceLabelsToRemove, threads);
      removeSystemLabelIdsFromThreads_(sourceSystemLabelIdsToRemove, threads);

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

function getFilterRemoveLabelIds_(labelIdByName, archive) {
  const out = {};
  if (archive) {
    out.INBOX = true;
  }
  SOURCE_SYSTEM_LABEL_IDS_TO_REMOVE.forEach(function(labelId) {
    out[labelId] = true;
  });
  SOURCE_LABEL_NAMES_TO_REMOVE.forEach(function(name) {
    if (labelIdByName[name]) {
      out[labelIdByName[name]] = true;
    }
  });
  return Object.keys(out);
}

function getGmailAppSourceLabelsToRemove_() {
  return SOURCE_LABEL_NAMES_TO_REMOVE.map(function(name) {
    return GmailApp.getUserLabelByName(name);
  }).filter(Boolean);
}

function removeLabelsFromThreads_(labels, threads) {
  if (!labels.length || !threads.length) {
    return;
  }
  labels.forEach(function(label) {
    label.removeFromThreads(threads);
  });
}

function removeSystemLabelIdsFromThreads_(labelIds, threads) {
  if (!labelIds.length || !threads.length || typeof Gmail === 'undefined') {
    return;
  }

  const messageIds = [];
  threads.forEach(function(thread) {
    thread.getMessages().forEach(function(message) {
      messageIds.push(message.getId());
    });
  });

  for (let i = 0; i < messageIds.length; i += 1000) {
    try {
      Gmail.Users.Messages.batchModify({
        ids: messageIds.slice(i, i + 1000),
        removeLabelIds: labelIds
      }, USER_ID);
    } catch (err) {
      Logger.log('Failed to remove system labels [' + labelIds.join(',') + ']: ' + err.message);
    }
  }
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

function quoteSearchValue_(value) {
  return '"' + String(value).replace(/"/g, '\\"') + '"';
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
