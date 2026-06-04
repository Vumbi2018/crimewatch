export const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crime Prevention PNG - Admin Portal</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f1724;
      color: #e2e8f0;
      min-height: 100vh;
    }
    .header {
      background: linear-gradient(135deg, #1a2744 0%, #0f1724 100%);
      border-bottom: 1px solid #2d3a4f;
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-badge {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .header p {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .stats-bar {
      display: flex;
      gap: 24px;
      padding: 20px 32px;
      border-bottom: 1px solid #1e293b;
    }
    .stat-card {
      background: #1a2744;
      border: 1px solid #2d3a4f;
      border-radius: 12px;
      padding: 16px 24px;
      flex: 1;
      text-align: center;
    }
    .stat-card .number {
      font-size: 28px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .stat-card .label {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    .stat-card.pending .number { color: #f59e0b; }
    .stat-card.reviewed .number { color: #3b82f6; }
    .stat-card.resolved .number { color: #22c55e; }
    .content {
      padding: 24px 32px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .toolbar h2 {
      font-size: 18px;
      font-weight: 600;
    }
    .toolbar .refresh-btn {
      background: #1d4ed8;
      color: #fff;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }
    .toolbar .refresh-btn:hover { background: #2563eb; }
    .filter-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .filter-btn {
      background: #1a2744;
      border: 1px solid #2d3a4f;
      color: #94a3b8;
      padding: 6px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }
    .filter-btn:hover, .filter-btn.active {
      background: #1d4ed8;
      border-color: #3b82f6;
      color: #fff;
    }
    .table-container {
      background: #1a2744;
      border: 1px solid #2d3a4f;
      border-radius: 12px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #0f1724;
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #2d3a4f;
    }
    td {
      padding: 14px 16px;
      font-size: 14px;
      border-bottom: 1px solid #1e293b;
      vertical-align: top;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: rgba(59, 130, 246, 0.05); }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-photo { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge-video { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .badge-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-reviewed { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge-resolved { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-high { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-medium { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-low { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .status-select {
      background: #0f1724;
      border: 1px solid #2d3a4f;
      color: #e2e8f0;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }
    .description-cell {
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tags-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .tag {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 11px;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }
    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.4;
    }
    .empty-state h3 { font-size: 18px; margin-bottom: 8px; color: #94a3b8; }
    .empty-state p { font-size: 14px; }
    .location-link {
      color: #60a5fa;
      text-decoration: none;
      font-size: 13px;
    }
    .location-link:hover { text-decoration: underline; }
    .reporter-info { font-size: 13px; color: #94a3b8; }
    .detail-modal {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 100;
      align-items: center;
      justify-content: center;
    }
    .detail-modal.show { display: flex; }
    .detail-content {
      background: #1a2744;
      border: 1px solid #2d3a4f;
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }
    .detail-content h3 {
      font-size: 18px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .detail-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 24px;
      cursor: pointer;
    }
    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #1e293b;
    }
    .detail-label {
      width: 140px;
      font-size: 13px;
      color: #94a3b8;
      flex-shrink: 0;
    }
    .detail-value {
      font-size: 14px;
      color: #e2e8f0;
      flex: 1;
    }
    @media (max-width: 768px) {
      .stats-bar { flex-direction: column; }
      .header { padding: 16px; }
      .content { padding: 16px; }
      .table-container { overflow-x: auto; }
      table { min-width: 800px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="header-badge">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div>
        <h1>Crime Prevention PNG</h1>
        <p>Admin Portal - Evidence Reports</p>
      </div>
    </div>
  </div>

  <div class="stats-bar">
    <div class="stat-card">
      <div class="number" id="totalCount">0</div>
      <div class="label">Total Reports</div>
    </div>
    <div class="stat-card pending">
      <div class="number" id="pendingCount">0</div>
      <div class="label">Pending</div>
    </div>
    <div class="stat-card reviewed">
      <div class="number" id="reviewedCount">0</div>
      <div class="label">Reviewed</div>
    </div>
    <div class="stat-card resolved">
      <div class="number" id="resolvedCount">0</div>
      <div class="label">Resolved</div>
    </div>
  </div>

  <div class="content">
    <div class="toolbar">
      <h2>Evidence Reports</h2>
      <button class="refresh-btn" onclick="loadReports()">Refresh</button>
    </div>
    <div class="filter-bar">
      <button class="filter-btn active" onclick="filterReports('all', this)">All</button>
      <button class="filter-btn" onclick="filterReports('pending', this)">Pending</button>
      <button class="filter-btn" onclick="filterReports('reviewed', this)">Reviewed</button>
      <button class="filter-btn" onclick="filterReports('resolved', this)">Resolved</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Incident</th>
            <th>Description</th>
            <th>Location</th>
            <th>Agency</th>
            <th>Priority</th>
            <th>Reporter</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="reportsBody">
        </tbody>
      </table>
      <div id="emptyState" class="empty-state" style="display:none;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        <h3>No reports yet</h3>
        <p>Evidence reports submitted from the app will appear here.</p>
      </div>
    </div>
  </div>

  <div class="detail-modal" id="detailModal">
    <div class="detail-content" id="detailContent"></div>
  </div>

  <script>
    let allReports = [];
    let currentFilter = 'all';

    async function loadReports() {
      try {
        const res = await fetch('/api/reports');
        allReports = await res.json();
        updateStats();
        renderReports();
      } catch (err) {
        console.error('Failed to load reports:', err);
      }
    }

    function updateStats() {
      document.getElementById('totalCount').textContent = allReports.length;
      document.getElementById('pendingCount').textContent = allReports.filter(r => r.status === 'pending').length;
      document.getElementById('reviewedCount').textContent = allReports.filter(r => r.status === 'reviewed').length;
      document.getElementById('resolvedCount').textContent = allReports.filter(r => r.status === 'resolved').length;
    }

    function filterReports(filter, btn) {
      currentFilter = filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderReports();
    }

    function renderReports() {
      const tbody = document.getElementById('reportsBody');
      const empty = document.getElementById('emptyState');
      const filtered = currentFilter === 'all' ? allReports : allReports.filter(r => r.status === currentFilter);

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
      }
      empty.style.display = 'none';

      tbody.innerHTML = filtered.map(r => {
        const date = new Date(r.submittedAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const typeBadge = '<span class="badge badge-' + r.evidenceType + '">' + r.evidenceType + '</span>';
        const priorityBadge = '<span class="badge badge-' + r.priority.toLowerCase() + '">' + r.priority + '</span>';
        const location = r.latitude && r.longitude
          ? '<a class="location-link" href="https://www.google.com/maps?q=' + r.latitude + ',' + r.longitude + '" target="_blank">' + (r.address || 'View Map') + '</a>'
          : (r.address || '-');
        const reporter = r.isAnonymous ? '<span style="color:#94a3b8;font-style:italic">Anonymous</span>' : (r.reporterName || '-');

        const hasFile = r.fileUrl ? '<span title="Evidence file attached" style="color:#3b82f6;margin-left:4px">&#9679;</span>' : '';
        return '<tr onclick="showDetail(\\'' + r.id + '\\')" style="cursor:pointer">'
          + '<td style="white-space:nowrap">' + date + '</td>'
          + '<td>' + typeBadge + hasFile + '</td>'
          + '<td>' + (r.incidentType || '-') + '</td>'
          + '<td class="description-cell">' + (r.description || '-') + '</td>'
          + '<td>' + location + '</td>'
          + '<td style="font-size:13px">' + r.agency + '</td>'
          + '<td>' + priorityBadge + '</td>'
          + '<td class="reporter-info">' + reporter + '</td>'
          + '<td><span class="badge badge-' + r.status + '">' + r.status + '</span></td>'
          + '<td onclick="event.stopPropagation()">'
          + '<select class="status-select" onchange="updateStatus(\\'' + r.id + '\\', this.value)">'
          + '<option value="pending"' + (r.status==='pending'?' selected':'') + '>Pending</option>'
          + '<option value="reviewed"' + (r.status==='reviewed'?' selected':'') + '>Reviewed</option>'
          + '<option value="resolved"' + (r.status==='resolved'?' selected':'') + '>Resolved</option>'
          + '</select></td></tr>';
      }).join('');
    }

    async function updateStatus(id, status) {
      try {
        await fetch('/api/reports/' + id + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: status })
        });
        await loadReports();
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }

    function buildMediaViewer(r) {
      if (!r.fileUrl) return '';
      const url = r.fileUrl.startsWith('http') ? r.fileUrl : window.location.origin + r.fileUrl;
      if (r.evidenceType === 'photo') {
        return '<div style="margin-bottom:20px;border-radius:10px;overflow:hidden;background:#0a0f1a;text-align:center">'
          + '<img src="' + url + '" style="max-width:100%;max-height:420px;object-fit:contain;display:block;margin:0 auto" />'
          + '<div style="padding:8px;display:flex;justify-content:flex-end">'
          + '<a href="' + url + '" download target="_blank" style="color:#3b82f6;font-size:13px;text-decoration:none">Download</a>'
          + '</div></div>';
      } else if (r.evidenceType === 'video') {
        return '<div style="margin-bottom:20px;border-radius:10px;overflow:hidden;background:#0a0f1a">'
          + '<video controls style="width:100%;max-height:420px;display:block"><source src="' + url + '"></video>'
          + '<div style="padding:8px;display:flex;justify-content:flex-end">'
          + '<a href="' + url + '" download target="_blank" style="color:#3b82f6;font-size:13px;text-decoration:none">Download</a>'
          + '</div></div>';
      } else if (r.evidenceType === 'audio') {
        return '<div style="margin-bottom:20px;padding:20px;border-radius:10px;background:#0a0f1a;display:flex;flex-direction:column;gap:12px;align-items:center">'
          + '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>'
          + '<audio controls style="width:100%"><source src="' + url + '"></audio>'
          + '<a href="' + url + '" download target="_blank" style="color:#3b82f6;font-size:13px;text-decoration:none">Download</a>'
          + '</div>';
      }
      return '';
    }

    function showDetail(id) {
      const r = allReports.find(function(report) { return report.id === id; });
      if (!r) return;
      const date = new Date(r.submittedAt).toLocaleString();
      const tags = (r.tags || []).map(function(t) { return '<span class="tag">' + t + '</span>'; }).join(' ') || '-';
      const location = r.latitude && r.longitude
        ? '<a class="location-link" href="https://www.google.com/maps?q=' + r.latitude + ',' + r.longitude + '" target="_blank">' + (r.address || r.latitude + ', ' + r.longitude) + '</a>'
        : (r.address || 'Not available');

      document.getElementById('detailContent').innerHTML = ''
        + '<h3>Report Details <button class="detail-close" onclick="closeDetail()">&times;</button></h3>'
        + buildMediaViewer(r)
        + '<div class="detail-row"><div class="detail-label">Report ID</div><div class="detail-value" style="font-size:12px;word-break:break-all">' + r.id + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Submitted</div><div class="detail-value">' + date + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Evidence Type</div><div class="detail-value"><span class="badge badge-' + r.evidenceType + '">' + r.evidenceType + '</span></div></div>'
        + '<div class="detail-row"><div class="detail-label">Incident Type</div><div class="detail-value">' + (r.incidentType || 'Not specified') + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Description</div><div class="detail-value">' + (r.description || 'No description') + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Location</div><div class="detail-value">' + location + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Tags</div><div class="detail-value"><div class="tags-cell">' + tags + '</div></div></div>'
        + '<div class="detail-row"><div class="detail-label">Agency</div><div class="detail-value">' + r.agency + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Priority</div><div class="detail-value"><span class="badge badge-' + r.priority.toLowerCase() + '">' + r.priority + '</span></div></div>'
        + '<div class="detail-row"><div class="detail-label">Reporter</div><div class="detail-value">' + (r.isAnonymous ? 'Anonymous' : (r.reporterName || '-')) + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Contact Phone</div><div class="detail-value">' + (r.contactPhone || '-') + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Contact Email</div><div class="detail-value">' + (r.contactEmail || '-') + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Status</div><div class="detail-value">'
        + '<select class="status-select" onchange="updateStatus(\\'' + r.id + '\\', this.value); closeDetail();">'
        + '<option value="pending"' + (r.status==='pending'?' selected':'') + '>Pending</option>'
        + '<option value="reviewed"' + (r.status==='reviewed'?' selected':'') + '>Reviewed</option>'
        + '<option value="resolved"' + (r.status==='resolved'?' selected':'') + '>Resolved</option>'
        + '</select></div></div>';
      document.getElementById('detailModal').classList.add('show');
    }

    function closeDetail() {
      document.getElementById('detailModal').classList.remove('show');
    }

    document.getElementById('detailModal').addEventListener('click', function(e) {
      if (e.target === this) closeDetail();
    });

    loadReports();
    setInterval(loadReports, 30000);
  </script>
</body>
</html>`;
