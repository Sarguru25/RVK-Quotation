export default function ActivityTimeline({ quote, localQuote, activityLogs }) {
  const websiteUser = localQuote?.userId;
  const creatorText = websiteUser 
    ? `${websiteUser.name} (${websiteUser.email})` 
    : (quote.salesperson_name || 'System');

  const sendLog = activityLogs?.find(log => log.action === 'SEND_EMAIL');
  const convertLog = activityLogs?.find(log => log.action === 'CONVERT_SO');

  const activities = [
    {
      id: 1,
      title: "Quotation Created",
      description: `Quotation ${quote.estimate_number} was created by ${creatorText}.`,
      date: quote.created_time || quote.date,
      icon: "plus",
      color: "bg-blue-500",
    },
  ];

  if (quote.status === "sent" || quote.status === "accepted" || quote.status === "declined" || quote.status === "invoiced") {
    const senderText = sendLog?.user ? ` by ${sendLog.user.name} (${sendLog.user.email})` : '';
    activities.push({
      id: 2,
      title: "Quotation Sent",
      description: `Quotation was sent to ${quote.customer_name}${senderText}.`,
      date: sendLog?.createdAt || quote.last_modified_time || quote.date,
      icon: "mail",
      color: "bg-purple-500",
    });
  }

  if (quote.status === "accepted" || quote.status === "invoiced") {
    activities.push({
      id: 3,
      title: "Quotation Accepted",
      description: `${quote.customer_name} accepted the quotation.`,
      date: quote.last_modified_time || quote.date,
      icon: "check",
      color: "bg-green-500",
    });
  }

  if (quote.status === "declined") {
    activities.push({
      id: 4,
      title: "Quotation Declined",
      description: `${quote.customer_name} declined the quotation.`,
      date: quote.last_modified_time || quote.date,
      icon: "x",
      color: "bg-red-500",
    });
  }

  if (quote.status === "invoiced" || quote.status === "converted") {
    const converterText = convertLog?.user ? `${convertLog.user.name} (${convertLog.user.email})` : creatorText;
    activities.push({
      id: 5,
      title: "Converted to SO",
      description: `Quotation was converted into a Sales Order by ${converterText}.`,
      date: convertLog?.createdAt || quote.last_modified_time || quote.date,
      icon: "file",
      color: "bg-indigo-500",
    });
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const getIcon = (type) => {
    switch (type) {
      case "plus":
        return <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
      case "mail":
        return <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
      case "check":
        return <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
      case "x":
        return <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
      case "file":
        return <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 mb-12 print:hidden w-full max-w-4xl mx-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Activity Timeline
      </h3>
      
      <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative pl-8">
            <div className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full ${activity.color} flex items-center justify-center shadow-sm border-4 border-white`}>
              {getIcon(activity.icon)}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-bold text-gray-800">{activity.title}</h4>
                <span className="text-xs text-gray-500 font-medium">{formatDate(activity.date)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}