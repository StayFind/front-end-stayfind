// status-notice.js — load AFTER home.js.
// Replaces checkLandlordStatusUpdate() from home.js (later function
// declarations win), so home.js stays untouched. Uses home.js globals:
// currentUser, isGuest, API_BASE, escapeHtml, buildListingsQuery, loadListings,
// allListingsCache, currentDisplayedItems, promptLogin.

(function injectStatusNoticeStyles() {
    if (document.getElementById('statusNoticeStyles')) return;
    const style = document.createElement('style');
    style.id = 'statusNoticeStyles';
    style.textContent = `
        .sn-popup.swal2-popup {
            width: 440px; max-width: calc(100vw - 32px);
            padding: 0; border-radius: 24px; overflow: hidden;
            font-family: 'Plus Jakarta Sans', 'Montserrat', sans-serif;
            box-shadow: 0 30px 80px rgba(8, 24, 60, 0.35);
        }
        .sn-popup .swal2-html-container { margin: 0; padding: 0; text-align: left; }
        .sn-popup .swal2-actions { margin: 0; padding: 0 24px 24px; gap: 10px; width: 100%; flex-wrap: nowrap; }

        /* Coloured header */
        .sn-header { position: relative; overflow: hidden; padding: 30px 24px 26px; text-align: center; color: #fff; }
        .sn-header::after {
            content: ""; position: absolute; width: 190px; height: 190px; border-radius: 50%;
            background: rgba(255,255,255,0.1); top: -90px; right: -60px; pointer-events: none;
        }
        .sn-header.sn-rejected { background: linear-gradient(135deg, #c62828, #ef5350); }
        .sn-header.sn-approved { background: linear-gradient(135deg, #1b7a3a, #43a047); }
        .sn-icon {
            position: relative; z-index: 1;
            width: 62px; height: 62px; border-radius: 50%; margin: 0 auto 14px;
            background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.45);
            display: flex; align-items: center; justify-content: center; font-size: 26px;
        }
        .sn-title { position: relative; z-index: 1; margin: 0 0 4px; font-size: 21px; font-weight: 800; letter-spacing: -0.3px; }
        .sn-subtitle { position: relative; z-index: 1; margin: 0; font-size: 13.5px; opacity: 0.92; }

        /* Body */
        .sn-body { padding: 22px 24px 8px; }
        .sn-label {
            display: block; margin: 0 0 8px; font-size: 11px; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.06em; color: #5c6b7a;
        }
        .sn-reason {
            background: #fff5f5; border: 1.5px solid #f6c9cb; border-left: 5px solid #e5484d;
            border-radius: 14px; padding: 14px 16px; margin: 0 0 20px;
            font-size: 15.5px; font-weight: 600; line-height: 1.55; color: #1a2332;
        }
        .sn-steps { list-style: none; margin: 0 0 6px; padding: 0; counter-reset: sn; }
        .sn-steps li {
            counter-increment: sn; display: flex; align-items: flex-start; gap: 12px;
            margin-bottom: 11px; font-size: 14px; font-weight: 600; line-height: 1.45; color: #1a2332;
        }
        .sn-steps li::before {
            content: counter(sn); flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
            background: #e3f2fd; color: #0d47a1; font-size: 12px; font-weight: 800;
            display: flex; align-items: center; justify-content: center; margin-top: 1px;
        }
        .sn-message { margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #1a2332; font-weight: 500; }

        /* Buttons */
        .sn-btn-main, .sn-btn-alt {
            flex: 1; margin: 0; padding: 13px 14px; border: none; border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer;
            transition: transform 0.12s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .sn-btn-main { background: linear-gradient(135deg, #0d47a1, #1565c0); color: #fff; box-shadow: 0 10px 22px rgba(13,71,161,0.3); }
        .sn-btn-main.sn-green { background: linear-gradient(135deg, #1b7a3a, #43a047); box-shadow: 0 10px 22px rgba(46,125,50,0.3); }
        .sn-btn-alt { background: #eef1f6; color: #475569; }
        .sn-btn-main:hover, .sn-btn-alt:hover { transform: translateY(-1px); }
        .sn-btn-alt:hover { background: #e3e8f0; }
    `;
    document.head.appendChild(style);
})();

// Opens Settings with the Landlord role already picked, so the document
// upload section is visible right away.
function openSettingsForResubmit() {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.click();
    const roleSelect = document.getElementById('editRole');
    if (roleSelect) {
        roleSelect.value = 'landlord';
        roleSelect.dispatchEvent(new Event('change'));
    }
}

function showRejectedNotice(reason) {
    return Swal.fire({
        html: `
            <div class="sn-header sn-rejected">
                <div class="sn-icon"><i class="fas fa-file-circle-xmark"></i></div>
                <h2 class="sn-title">Landlord Request Rejected</h2>
                <p class="sn-subtitle">Your documents need a little fix.</p>
            </div>
            <div class="sn-body">
                <span class="sn-label">Reason from admin</span>
                <div class="sn-reason">${escapeHtml(reason || 'Your submitted documents did not meet our requirements.')}</div>

                <span class="sn-label">What to do next</span>
                <ol class="sn-steps">
                    <li>Open <strong>&nbsp;Settings&nbsp;</strong> and choose the Landlord role.</li>
                    <li>Upload clear, readable photos of your documents.</li>
                    <li>Submit again &mdash; an admin will review it.</li>
                </ol>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonText: '<i class="fas fa-file-arrow-up"></i>&nbsp; Update documents',
        showCancelButton: true,
        cancelButtonText: 'Later',
        reverseButtons: true,
        buttonsStyling: false,
        focusConfirm: false,
        customClass: {
            popup: 'sn-popup',
            confirmButton: 'sn-btn-main',
            cancelButton: 'sn-btn-alt'
        }
    }).then((result) => {
        if (result.isConfirmed) openSettingsForResubmit();
    });
}

// After the landlord clicks OK the page reloads, so the Post button and
// the landlord view are fully ready.
function showApprovedNotice() {
    return Swal.fire({
        html: `
            <div class="sn-header sn-approved">
                <div class="sn-icon"><i class="fas fa-circle-check"></i></div>
                <h2 class="sn-title">You're Approved! 🎉</h2>
                <p class="sn-subtitle">Landlord access is now unlocked.</p>
            </div>
            <div class="sn-body">
                <p class="sn-message">Congratulations! The <strong>Post</strong> button is now available, so you can start listing your properties.</p>
            </div>
        `,
        confirmButtonText: 'Great!',
        buttonsStyling: false,
        customClass: {
            popup: 'sn-popup',
            confirmButton: 'sn-btn-main sn-green'
        }
    }).then(() => window.location.reload());
}

// Same logic as home.js's version — only the popups changed.
async function checkLandlordStatusUpdate() {
    if (!currentUser || !currentUser.id) return;

    try {
        const res = await fetch(`${API_BASE}/view/${currentUser.id}`);
        if (!res.ok) return;
        const freshUser = await res.json();
        if (!freshUser || freshUser.message === 'User not found') return;

        const newStatus = freshUser.landlord_status || 'none';
        const newReason = freshUser.landlord_rejection_reason || '';
        const seenKey = `landlordSeen_${currentUser.id}`;
        const lastSeen = localStorage.getItem(seenKey) || '';
        const currentSignature = newStatus === 'rejected' ? `rejected|${newReason}` : newStatus;

        if (currentSignature !== lastSeen) {
            if (newStatus === 'approved' && lastSeen.startsWith('pending')) {
                showApprovedNotice();
            } else if (newStatus === 'rejected') {
                showRejectedNotice(newReason);
            }
            localStorage.setItem(seenKey, currentSignature);
        }

        if (currentUser.landlord_status !== freshUser.landlord_status || currentUser.role !== freshUser.role) {
            currentUser.role = freshUser.role;
            currentUser.landlord_status = freshUser.landlord_status;
            currentUser.landlord_rejection_reason = freshUser.landlord_rejection_reason;
            localStorage.setItem('user', JSON.stringify(currentUser));

            const postBtn = document.getElementById('postBtn');
            if (postBtn) postBtn.style.display = (currentUser.role === 'landlord') ? 'flex' : 'none';
            const postFab = document.getElementById('postFab');
            if (postFab) postFab.style.display = (currentUser.role === 'landlord') ? '' : 'none';
        }
    } catch (err) {
        console.log("Landlord status check failed silently:", err);
    }
}

// ===================== BLOCK RE-SUBMIT WHILE PENDING =====================
// While a landlord request is pending, the Landlord option is disabled and
// documents can't be uploaded again. They wait for approve/reject.

function isLandlordRequestPending() {
    return !!currentUser
        && currentUser.landlord_status === 'pending'
        && currentUser.role !== 'landlord';
}

const _setupSettingsLogicOriginal = setupSettingsLogic;
setupSettingsLogic = function () {
    _setupSettingsLogicOriginal();

    const settingsBtn = document.getElementById('settingsBtn');
    const saveBtn = document.getElementById('saveSettingsBtn');
    const roleSelect = document.getElementById('editRole');
    const docsSection = document.getElementById('settingsLandlordDocsSection');
    if (!settingsBtn || !saveBtn || !roleSelect || !docsSection) return;

    const landlordOption = roleSelect.querySelector('option[value="landlord"]');

    // Banner shown in Settings while pending
    let banner = document.getElementById('pendingRequestBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'pendingRequestBanner';
        banner.style.cssText = 'display:none; background:#fff8e1; border:1.5px solid #ffe0a3; border-left:5px solid #f59e0b; border-radius:12px; padding:12px 14px; margin-bottom:20px; font-size:12.5px; line-height:1.5; color:#8a5a00; font-weight:600;';
        banner.innerHTML = '<i class="fas fa-hourglass-half"></i> <strong>Landlord request pending.</strong> Your documents were already submitted. Please wait for the admin to approve or reject them before submitting again.';
        docsSection.insertAdjacentElement('beforebegin', banner);
    }

    function applyPendingState() {
        if (isLandlordRequestPending()) {
            if (landlordOption) {
                landlordOption.disabled = true;
                landlordOption.textContent = 'Landlord (request pending)';
            }
            roleSelect.value = 'tenant';
            docsSection.style.display = 'none';
            banner.style.display = 'block';
        } else {
            if (landlordOption) {
                landlordOption.disabled = false;
                landlordOption.textContent = 'Landlord';
            }
            banner.style.display = 'none';
        }
    }

    // Every time Settings opens
    const openOriginal = settingsBtn.onclick;
    settingsBtn.onclick = function (e) {
        if (openOriginal) openOriginal.call(this, e);
        applyPendingState();
    };

    // Extra guard on Save, even if the dropdown is bypassed
    const saveOriginal = saveBtn.onclick;
    saveBtn.onclick = async function (e) {
        if (isLandlordRequestPending() && roleSelect.value === 'landlord') {
            return Swal.fire({
                title: 'Request already pending',
                text: 'You already submitted a landlord request. Please wait for the admin decision.',
                icon: 'info',
                target: '#settingsModal'
            });
        }
        return saveOriginal.call(this, e);
    };

    applyPendingState();
};

// ===================== LISTINGS HIDDEN BY AN ADMIN (+ APPEALS) =====================
// The server only sends a hidden listing to the landlord who OWNS it (with
// is_hidden = 1, hidden_reason and the appeal fields). Nobody else ever receives
// it. This section:
//   1. puts a red "Hidden" chip on those cards,
//   2. shows the admin's reason (and the appeal box) at the top of the details modal,
//   3. shows a one-time popup when a listing is newly hidden.
// It wraps renderListings() and showFullDetails() from home.js instead of editing it.

(function injectHiddenListingStyles() {
    if (document.getElementById('hiddenListingStyles')) return;
    const style = document.createElement('style');
    style.id = 'hiddenListingStyles';
    style.textContent = `
        .listing-card.is-hidden-listing .carousel-container { opacity: 0.55; filter: grayscale(0.5); }
        .hidden-chip {
            display: inline-flex; align-items: center; gap: 6px;
            color: #fff; font-size: 10.5px; font-weight: 700;
            padding: 5px 11px 5px 9px; border-radius: 20px; letter-spacing: 0.2px;
            background: rgba(198, 40, 40, 0.92);
        }
        .hidden-notice {
            background: #fff5f5; border: 1.5px solid #f6c9cb; border-left: 5px solid #e5484d;
            border-radius: 14px; padding: 14px 16px; margin: 0 0 16px;
        }
        .hidden-notice-title { font-size: 13.5px; font-weight: 800; color: #c62828; margin: 0 0 8px; }
        .hidden-notice-reason { margin: 0 0 8px; font-size: 14px; font-weight: 600; line-height: 1.5; color: #1a2332; overflow-wrap: anywhere; }
        .hidden-notice-help { margin: 0; font-size: 12px; line-height: 1.5; color: #5c6b7a; }
        .hidden-notice-appeal {
            margin: 12px 0 0; padding: 10px 12px; border-radius: 10px;
            background: #eef6fe; border: 1px solid #c3e0fb;
            font-size: 12.5px; line-height: 1.5; color: #1a2332; overflow-wrap: anywhere;
        }
        .hidden-appeal-btn {
            margin-top: 12px; padding: 10px 16px; border: none; border-radius: 10px; cursor: pointer;
            background: linear-gradient(135deg, #0d47a1, #1565c0); color: #fff;
            font-size: 12.5px; font-weight: 800;
            display: inline-flex; align-items: center; gap: 8px;
        }
        .hidden-appeal-btn:hover { filter: brightness(1.08); }
        .hidden-popup-list { list-style: none; margin: 14px 0 0; padding: 0; text-align: left; }
        .hidden-popup-list li { background: #fff5f5; border: 1px solid #f6c9cb; border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; font-size: 13px; }
        .hidden-popup-list li strong { display: block; color: #1a2332; margin-bottom: 3px; }
        .hidden-popup-list li span { color: #5c6b7a; overflow-wrap: anywhere; }
    `;
    document.head.appendChild(style);
})();

function isHiddenOwnListing(item) {
    return !!currentUser && !!item
        && Number(item.is_hidden) === 1
        && String(item.user_id) === String(currentUser.id);
}

// 1. Cards: dim the photo and add the "Hidden" chip next to the category/status chips.
function decorateHiddenListings(items) {
    if (!Array.isArray(items)) return;
    items.forEach(item => {
        if (!isHiddenOwnListing(item)) return;
        const card = document.querySelector(`.listing-card[data-id="${item.id}"]`);
        if (!card) return;
        card.classList.add('is-hidden-listing');
        const badges = card.querySelector('.card-badges');
        if (badges && !badges.querySelector('.hidden-chip')) {
            badges.insertAdjacentHTML('beforeend', '<span class="hidden-chip"><i class="fas fa-eye-slash"></i> Hidden</span>');
        }
    });
}

// 3. One-time popup. The remembered value uses the "landlordSeen_" prefix so it
// survives logout (the app keeps every key starting with that prefix).
let hiddenAnnouncementChecked = false;
function announceHiddenListings(items) {
    if (hiddenAnnouncementChecked || !currentUser || currentUser.role !== 'landlord' || !Array.isArray(items)) return;
    hiddenAnnouncementChecked = true;

    const hidden = items.filter(isHiddenOwnListing);
    const signature = hidden.map(i => `${i.id}:${i.hidden_at || ''}`).sort().join('|');
    const key = `landlordSeen_hidden_${currentUser.id}`;
    if (signature === (localStorage.getItem(key) || '')) return;
    localStorage.setItem(key, signature);
    if (hidden.length === 0) return;

    const shown = hidden.slice(0, 5);
    const more = hidden.length - shown.length;
    Swal.fire({
        title: hidden.length === 1 ? 'One of your listings was hidden' : `${hidden.length} of your listings were hidden`,
        html: `
            <p style="font-size:13.5px; color:#5c6b7a; margin:0; line-height:1.55;">An admin hid ${hidden.length === 1 ? 'it' : 'them'} from the public. Only you can still see ${hidden.length === 1 ? 'it' : 'them'}.</p>
            <ul class="hidden-popup-list">
                ${shown.map(i => `<li><strong>${escapeHtml(i.title || 'Listing')}</strong><span>${escapeHtml(i.hidden_reason || 'No reason given.')}</span></li>`).join('')}
            </ul>
            ${more > 0 ? `<p style="font-size:12px; color:#94a3b8; margin:6px 0 0;">…and ${more} more.</p>` : ''}
        `,
        icon: 'warning',
        confirmButtonText: 'Got it'
    });
}

const _renderListingsHiddenOriginal = renderListings;
renderListings = async function (items) {
    await _renderListingsHiddenOriginal(items);
    decorateHiddenListings(items);
    announceHiddenListings(items);
};

// 2. Details modal: the admin's reason + the appeal box, above the photos.
function renderHiddenNotice(item) {
    const old = document.getElementById('hiddenListingNotice');
    if (old) old.remove();

    const wrapper = document.getElementById('carouselWrapper');
    if (!wrapper || !isHiddenOwnListing(item)) return;

    const appealHtml = item.appeal_at
        ? `<p class="hidden-notice-appeal"><i class="fas fa-paper-plane"></i> <strong>Appeal sent</strong> on ${escapeHtml(new Date(item.appeal_at).toLocaleDateString())}. An admin will review it.<br><em>${escapeHtml(item.appeal_message || '')}</em></p>`
        : `<button type="button" class="hidden-appeal-btn" id="hiddenAppealBtn"><i class="fas fa-flag"></i> Request review</button>`;

    wrapper.insertAdjacentHTML('beforebegin', `
        <div class="hidden-notice" id="hiddenListingNotice">
            <div class="hidden-notice-title"><i class="fas fa-eye-slash"></i> Hidden by a StayFind admin</div>
            <p class="hidden-notice-reason">${escapeHtml(item.hidden_reason || 'No reason given.')}</p>
            <p class="hidden-notice-help">Tenants can't see this listing right now. You can still edit it. Fix the issue, then send an appeal so an admin can review it.</p>
            ${appealHtml}
        </div>
    `);

    const btn = document.getElementById('hiddenAppealBtn');
    if (btn) btn.onclick = () => requestListingReview(item);
}

// The landlord asks an admin to review a hidden listing.
async function requestListingReview(item) {
    const { value, isConfirmed } = await Swal.fire({
        title: 'Request a review',
        input: 'textarea',
        inputLabel: 'What did you fix, or why should this listing be shown again?',
        inputPlaceholder: 'e.g. I replaced the photos and corrected the price.',
        inputAttributes: { maxlength: 500 },
        showCancelButton: true,
        confirmButtonText: 'Send appeal',
        inputValidator: (v) => (!v || v.trim().length < 10) ? 'Please write at least 10 characters.' : undefined
    });
    if (!isConfirmed) return;

    try {
        const res = await fetch(`${API_BASE}/listings/${item.id}/appeal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: value.trim() })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
            item.appeal_message = value.trim();
            item.appeal_at = data.appeal_at || new Date().toISOString();
            liveListingSig = null; // our own change: don't announce it as an admin update
            renderHiddenNotice(item);
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Appeal sent', showConfirmButton: false, timer: 2500 });
        } else {
            Swal.fire('Could not send', data.message || 'Please try again.', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Could not connect to the server.', 'error');
    }
}

// The details-modal wrapper now also adds the Report button (see further below).
const _showFullDetailsHiddenOriginal = showFullDetails;
showFullDetails = function (item) {
    _showFullDetailsHiddenOriginal(item);
    renderHiddenNotice(item);
    renderReportButton(item);
};

// ===================== LANDLORD: DELETE COMMENTS ON THEIR LISTING =====================
// home.js builds the comment list. After it finishes, this adds a "Delete"
// button to every comment when the viewer owns the listing. A tenant's review
// that has a star rating only loses its text: the rating still counts.
const LANDLORD_REMOVED_TEXT = '[Comment removed by the landlord]';

(function injectCommentDeleteStyles() {
    if (document.getElementById('commentDeleteStyles')) return;
    const style = document.createElement('style');
    style.id = 'commentDeleteStyles';
    style.textContent = `
        .comment-delete-link {
            display: inline-block; margin: 7px 0 0 12px; background: none; border: none;
            padding: 0; color: #e5484d; font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .comment-delete-link:hover { text-decoration: underline; }
    `;
    document.head.appendChild(style);
})();

const _loadCommentsOriginal = loadComments;
loadComments = async function (listingId, isOwner) {
    await _loadCommentsOriginal(listingId, isOwner);
    if (isOwner) addLandlordDeleteButtons(listingId);
};

async function addLandlordDeleteButtons(listingId) {
    const list = document.getElementById('commentsDisplayList');
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE}/get-reviews/${listingId}`);
        const reviews = await res.json();
        if (!Array.isArray(reviews) || reviews.length === 0) return;

        // Same order home.js renders them in: each top-level comment, then its replies.
        const byId = new Map(reviews.map(r => [r.id, r]));
        const topLevel = reviews.filter(r => !r.parent_review_id || !byId.has(r.parent_review_id));
        const repliesByParent = new Map();
        reviews.forEach(r => {
            if (r.parent_review_id && byId.has(r.parent_review_id)) {
                if (!repliesByParent.has(r.parent_review_id)) repliesByParent.set(r.parent_review_id, []);
                repliesByParent.get(r.parent_review_id).push(r);
            }
        });
        const ordered = [];
        topLevel.forEach(r => {
            ordered.push(r);
            (repliesByParent.get(r.id) || []).forEach(x => ordered.push(x));
        });

        const items = list.querySelectorAll('.comment-item');
        if (items.length !== ordered.length) return; // the list changed meanwhile: skip

        items.forEach((el, i) => {
            const rev = ordered[i];
            const isReply = Number(rev.is_reply) === 1;
            if (!isReply && rev.comment === LANDLORD_REMOVED_TEXT) return; // already removed
            const body = el.querySelector('.comment-body');
            if (!body || body.querySelector('.comment-delete-link')) return;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'comment-delete-link';
            btn.textContent = 'Delete';
            btn.onclick = () => deleteCommentAsLandlord(rev, listingId);
            body.appendChild(btn);
        });
    } catch (err) {
        console.log('Could not add delete buttons:', err);
    }
}

async function deleteCommentAsLandlord(rev, listingId) {
    const isReply = Number(rev.is_reply) === 1;
    const keepsRating = !isReply && Number(rev.rating) > 0;

    const c = await Swal.fire({
        title: 'Delete this comment?',
        text: keepsRating
            ? "The text will be removed, but the tenant's star rating still counts toward your average."
            : 'This cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff5252',
        confirmButtonText: 'Yes, delete'
    });
    if (!c.isConfirmed) return;

    try {
        const res = await fetch(`${API_BASE}/delete-review/${rev.id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
            loadComments(listingId, true);
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: data.message || 'Comment deleted', showConfirmButton: false, timer: 2200 });
        } else {
            Swal.fire('Error', data.message || 'Could not delete the comment.', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Could not connect to the server.', 'error');
    }
}

// ===================== NEW: REPORT A LISTING =====================
// A "Report this listing" button under the landlord info in the details modal.
// Guests are asked to log in; the owner never sees it. Reports never hide a
// listing by themselves - an admin reviews them.
const REPORT_REASONS = [
    ['fake', 'Fake or misleading listing'],
    ['wrong_info', 'Wrong price or details'],
    ['scam', 'Suspected scam'],
    ['inappropriate', 'Inappropriate content'],
    ['unavailable', 'Already rented / no longer available'],
    ['other', 'Something else']
];

(function injectReportStyles() {
    if (document.getElementById('reportStyles')) return;
    const style = document.createElement('style');
    style.id = 'reportStyles';
    style.textContent = `
        .report-listing-btn {
            width: 100%; margin-top: 10px; padding: 9px; border: 1.5px solid #f3c4c6; border-radius: 10px;
            background: #fff; color: #c0392f; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .report-listing-btn:hover { background: #fff5f5; }
        .report-options { display: flex; flex-direction: column; gap: 8px; text-align: left; }
        .report-option {
            display: flex; align-items: center; gap: 10px; padding: 10px 12px;
            border: 1.5px solid #e8edf3; border-radius: 12px; cursor: pointer;
            font-size: 13px; font-weight: 600; color: #1a2332; margin: 0;
        }
        .report-option input { margin: 0; accent-color: #e5484d; }
        .report-option:has(input:checked) { border-color: #e5484d; background: #fff5f5; }
        .report-details {
            width: 100%; min-height: 80px; margin: 12px 0 0; padding: 10px 12px; box-sizing: border-box;
            border: 1.5px solid #e8edf3; border-radius: 12px; font: inherit; font-size: 13px; resize: vertical;
        }
    `;
    document.head.appendChild(style);
})();

function renderReportButton(item) {
    const old = document.getElementById('reportListingBtn');
    if (old) old.remove();

    const box = document.querySelector('#detailsModal .landlord-info-box');
    if (!box || !item || !item.user_id) return;
    if (currentUser && String(currentUser.id) === String(item.user_id)) return; // not on your own listing

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'reportListingBtn';
    btn.className = 'report-listing-btn';
    btn.innerHTML = '<i class="fas fa-flag"></i> Report this listing';
    btn.onclick = () => {
        if (isGuest) { promptLogin('Log in to report a listing.'); return; }
        reportListing(item);
    };
    box.appendChild(btn);
}

async function reportListing(item) {
    const { value, isConfirmed } = await Swal.fire({
        title: 'Report this listing',
        html: `
            <div class="report-options">
                ${REPORT_REASONS.map(([key, label]) => `
                    <label class="report-option"><input type="radio" name="reportReason" value="${key}"><span>${label}</span></label>
                `).join('')}
            </div>
            <textarea id="reportDetails" class="report-details" maxlength="500" placeholder="Add details (optional - required for “Something else”)"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'Send report',
        confirmButtonColor: '#e5484d',
        focusConfirm: false,
        preConfirm: () => {
            const checked = document.querySelector('input[name="reportReason"]:checked');
            if (!checked) { Swal.showValidationMessage('Please choose a reason.'); return false; }
            const details = document.getElementById('reportDetails').value.trim();
            if (checked.value === 'other' && details.length < 5) {
                Swal.showValidationMessage('Please describe the problem.');
                return false;
            }
            return { reason: checked.value, details };
        }
    });
    if (!isConfirmed) return;

    try {
        const res = await fetch(`${API_BASE}/listings/${item.id}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Report sent. Thank you!', showConfirmButton: false, timer: 3000 });
        } else if (res.status === 409) {
            Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: data.message || 'Already reported.', showConfirmButton: false, timer: 3000 });
        } else {
            Swal.fire('Could not send the report', data.message || 'Please try again.', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Could not connect to the server.', 'error');
    }
}

// ===================== NEW: NOTIFICATION BELL =====================
// A bell in the top-right pill (logged-in users only). It shows an unread badge,
// opens a panel with the latest notifications, and checks the server every ~15
// seconds (see liveTick below).
const NOTIF_ICONS = {
    landlord_approved: ['fa-circle-check', 'good'],
    landlord_rejected: ['fa-file-circle-xmark', 'bad'],
    listing_hidden: ['fa-eye-slash', 'bad'],
    listing_unhidden: ['fa-eye', 'good'],
    appeal_declined: ['fa-ban', 'bad'],
    new_review: ['fa-star', 'info'],
    review_reply: ['fa-reply', 'info'],
    report_update: ['fa-flag', 'info'],
    account_reinstated: ['fa-user-check', 'good']
};

(function injectNotificationStyles() {
    if (document.getElementById('notifStyles')) return;
    const style = document.createElement('style');
    style.id = 'notifStyles';
    style.textContent = `
        .notif-bell {
            position: relative; width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
            border: none; background: transparent; color: var(--primary); font-size: 16px; cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center; transition: background 0.15s;
        }
        .notif-bell:hover { background: #eef4fd; }
        .notif-badge {
            position: absolute; top: 1px; right: 0; min-width: 17px; height: 17px; padding: 0 4px;
            border-radius: 999px; background: var(--danger); color: #fff; font-size: 10px; font-weight: 800;
            display: flex; align-items: center; justify-content: center; line-height: 1; border: 2px solid #fff; box-sizing: content-box;
        }
        .notif-panel {
            display: none; position: absolute; top: calc(100% + 10px); right: 0;
            width: 360px; max-width: calc(100vw - 32px); background: #fff; border-radius: 16px; overflow: hidden;
            border: 1px solid var(--border); box-shadow: var(--shadow-lg); animation: floatIn 0.15s ease;
        }
        .notif-panel.open { display: block; }
        .notif-head {
            display: flex; align-items: center; justify-content: space-between; gap: 8px;
            padding: 13px 16px; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--ink);
        }
        .notif-head-actions { display: flex; gap: 12px; }
        .notif-head-actions button {
            background: none; border: none; padding: 0; cursor: pointer;
            font-size: 11.5px; font-weight: 700; color: var(--primary);
        }
        .notif-head-actions button:hover { text-decoration: underline; }
        .notif-list { max-height: min(420px, 60vh); overflow-y: auto; }
        .notif-item {
            display: flex; gap: 12px; padding: 12px 16px; cursor: pointer;
            border-bottom: 1px solid #f1f4f8; transition: background 0.12s;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: #f4f8fd; }
        .notif-item.unread { background: #f1f8ff; }
        .notif-icon {
            width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; font-size: 13px;
            display: flex; align-items: center; justify-content: center;
            background: #e3f2fd; color: var(--primary);
        }
        .notif-icon.good { background: #e6f7ec; color: var(--success); }
        .notif-icon.bad { background: #fdeaea; color: #c0392f; }
        .notif-text { min-width: 0; flex: 1; }
        .notif-title { font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.3; }
        .notif-msg { margin-top: 2px; font-size: 12.5px; color: var(--ink-soft); line-height: 1.45; overflow-wrap: anywhere; }
        .notif-time { margin-top: 4px; font-size: 11px; color: var(--muted); font-weight: 600; }
        .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); flex-shrink: 0; margin-top: 6px; }
        .notif-empty { padding: 34px 16px; text-align: center; color: var(--muted); font-size: 13px; }
        .notif-empty i { display: block; font-size: 24px; margin-bottom: 8px; color: #cbd5e1; }
        @media (max-width: 768px) {
            body:not(.is-guest) .sticky-search-bar { padding-right: 120px !important; }
        }
    `;
    document.head.appendChild(style);
})();

const notifState = { items: [], unread: 0, topId: null };

function notifTimeAgo(iso) {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return 'Just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isNotifPanelOpen() {
    const panel = document.getElementById('notifPanel');
    return !!panel && panel.classList.contains('open');
}

function closeNotifPanel() {
    const panel = document.getElementById('notifPanel');
    if (panel) panel.classList.remove('open');
    const bell = document.getElementById('notifBellBtn');
    if (bell) bell.setAttribute('aria-expanded', 'false');
}

function renderNotifBadge() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (notifState.unread > 0) {
        badge.textContent = notifState.unread > 99 ? '99+' : String(notifState.unread);
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderNotifList() {
    const list = document.getElementById('notifList');
    if (!list) return;

    if (notifState.items.length === 0) {
        list.innerHTML = `<div class="notif-empty"><i class="fas fa-bell-slash"></i>You're all caught up.</div>`;
        return;
    }

    list.innerHTML = notifState.items.map(n => {
        const [icon, tone] = NOTIF_ICONS[n.type] || ['fa-bell', 'info'];
        const unread = !Number(n.is_read);
        return `
            <div class="notif-item${unread ? ' unread' : ''}" data-id="${Number(n.id)}" data-listing="${n.listing_id ? Number(n.listing_id) : ''}">
                <div class="notif-icon ${tone}"><i class="fas ${icon}"></i></div>
                <div class="notif-text">
                    <div class="notif-title">${escapeHtml(n.title)}</div>
                    <div class="notif-msg">${escapeHtml(n.message)}</div>
                    <div class="notif-time">${escapeHtml(notifTimeAgo(n.created_at))}</div>
                </div>
                ${unread ? '<span class="notif-dot"></span>' : ''}
            </div>`;
    }).join('');
}

async function pollNotifications() {
    if (!currentUser) return;

    try {
        const res = await fetch(`${API_BASE}/notifications`);
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data.notifications) ? data.notifications : [];
        const topId = items.length ? Number(items[0].id) : 0;

        // A toast for anything new since the last check (not on the very first check).
        if (notifState.topId !== null && topId > notifState.topId && !isNotifPanelOpen() && !Swal.isVisible()) {
            const fresh = items.filter(n => Number(n.id) > notifState.topId && !Number(n.is_read));
            if (fresh.length > 0) {
                Swal.fire({
                    toast: true, position: 'top', icon: 'info', showConfirmButton: false, timer: 4500,
                    title: fresh.length === 1 ? fresh[0].title : `${fresh.length} new notifications`
                });
            }
        }

        notifState.topId = topId;
        notifState.items = items;
        notifState.unread = Number(data.unread) || 0;
        renderNotifBadge();
        if (isNotifPanelOpen()) renderNotifList();
    } catch (err) {
        console.log('Notification check failed silently:', err);
    }
}

// Opens the details modal of a listing from a notification.
async function openListingFromNotification(listingId) {
    const find = (rows) => rows.find(i => String(i.id) === String(listingId));
    let item = find(allListingsCache) || find(currentDisplayedItems);

    if (!item) {
        try {
            const res = await fetch(buildListingsQuery('all=true'));
            const data = await res.json();
            item = find(Array.isArray(data.listings) ? data.listings : []);
        } catch (err) { /* handled below */ }
    }

    if (item) {
        showFullDetails(item);
    } else {
        Swal.fire({ toast: true, position: 'top', icon: 'info', title: 'That listing is no longer available.', showConfirmButton: false, timer: 3000 });
    }
}

function setupNotificationBell() {
    if (!currentUser) return;
    const box = document.getElementById('topActions');
    if (!box || document.getElementById('notifBellBtn')) return;

    const bell = document.createElement('button');
    bell.type = 'button';
    bell.id = 'notifBellBtn';
    bell.className = 'notif-bell';
    bell.setAttribute('aria-label', 'Notifications');
    bell.setAttribute('aria-haspopup', 'true');
    bell.setAttribute('aria-expanded', 'false');
    bell.innerHTML = '<i class="fas fa-bell"></i><span id="notifBadge" class="notif-badge" style="display:none;">0</span>';

    const panel = document.createElement('div');
    panel.id = 'notifPanel';
    panel.className = 'notif-panel';
    panel.innerHTML = `
        <div class="notif-head">
            <strong>Notifications</strong>
            <div class="notif-head-actions">
                <button type="button" id="notifReadAll">Mark all read</button>
                <button type="button" id="notifClear">Clear</button>
            </div>
        </div>
        <div id="notifList" class="notif-list"></div>`;

    box.insertBefore(bell, box.firstChild);
    box.appendChild(panel);

    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !panel.classList.contains('open');
        const userMenu = document.getElementById('userMenu');
        if (userMenu) userMenu.classList.remove('open');
        panel.classList.toggle('open', open);
        bell.setAttribute('aria-expanded', String(open));
        if (open) { renderNotifList(); pollNotifications(); }
    });

    // Opening the account menu closes the bell panel.
    const chip = document.getElementById('userChipBtn');
    if (chip) chip.addEventListener('click', closeNotifPanel);

    document.addEventListener('click', (e) => { if (!box.contains(e.target)) closeNotifPanel(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNotifPanel(); });

    document.getElementById('notifReadAll').addEventListener('click', async () => {
        notifState.items.forEach(n => { n.is_read = 1; });
        notifState.unread = 0;
        renderNotifBadge();
        renderNotifList();
        try { await fetch(`${API_BASE}/notifications/read-all`, { method: 'POST' }); } catch (err) { /* ignore */ }
    });

    document.getElementById('notifClear').addEventListener('click', async () => {
        notifState.items = [];
        notifState.unread = 0;
        renderNotifBadge();
        renderNotifList();
        try { await fetch(`${API_BASE}/notifications`, { method: 'DELETE' }); } catch (err) { /* ignore */ }
    });

    document.getElementById('notifList').addEventListener('click', async (e) => {
        const row = e.target.closest('.notif-item');
        if (!row) return;
        const id = Number(row.dataset.id);
        const listingId = row.dataset.listing;

        const n = notifState.items.find(x => Number(x.id) === id);
        if (n && !Number(n.is_read)) {
            n.is_read = 1;
            notifState.unread = Math.max(0, notifState.unread - 1);
            renderNotifBadge();
            renderNotifList();
            try { await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' }); } catch (err) { /* ignore */ }
        }

        if (listingId) {
            closeNotifPanel();
            openListingFromNotification(listingId);
        }
    });
}

// The inline script in home.html fills the top-right pill while the page loads,
// so the bell is added once the page is ready.
if (currentUser) {
    const initBell = () => { setupNotificationBell(); pollNotifications(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBell);
    else initBell();
}

// ===================== LIVE UPDATES (no reload needed) =====================
// Every ~15 seconds, while the tab is visible and the person is logged in:
//   1. checkLandlordStatusUpdate() asks the server for the fresh profile. This
//      also catches a SUSPENSION (the server answers 401 and auth-fetch.js shows
//      the "Account suspended" popup), and landlord approval / rejection.
//   2. A landlord's own listings are re-checked; if an admin hid, unhid or
//      answered an appeal, the grid refreshes by itself.
//   3. NEW: notifications are re-checked for the bell.
// Nothing refreshes while a popup or modal is open, so no one is interrupted.
const LIVE_INTERVAL_MS = 15000;
let liveListingSig = null; // null = "take a fresh baseline on the next check"

function anyModalOpen() {
    const ids = ['detailsModal', 'postModal', 'messagesModal', 'settingsModal'];
    const open = ids.some(id => {
        const el = document.getElementById(id);
        return el && el.style.display === 'block';
    });
    return open || (typeof Swal !== 'undefined' && Swal.isVisible());
}

async function pollOwnListings() {
    if (!currentUser || currentUser.role !== 'landlord') return;

    try {
        const res = await fetch(buildListingsQuery('all=true'));
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data.listings) ? data.listings : [];

        const sig = rows
            .map(l => `${l.id}:${l.is_hidden}:${l.appeal_at || ''}:${l.hidden_reason || ''}`)
            .sort().join('|');

        if (liveListingSig === null) { liveListingSig = sig; return; } // first check = baseline
        if (sig === liveListingSig) return;
        if (anyModalOpen()) return; // something changed, but wait until the person is free

        liveListingSig = sig;
        hiddenAnnouncementChecked = false; // let the "was hidden" popup run again for new hides
        loadListings();
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Your listings were updated', showConfirmButton: false, timer: 3500 });
    } catch (err) {
        console.log('Live listing check failed silently:', err);
    }
}

function liveTick() {
    if (!currentUser || document.hidden) return;
    checkLandlordStatusUpdate();
    pollOwnListings();
    pollNotifications();
}

if (currentUser) {
    setInterval(liveTick, LIVE_INTERVAL_MS);
    // Coming back to the tab: check right away instead of waiting for the timer.
    document.addEventListener('visibilitychange', () => { if (!document.hidden) liveTick(); });
}
