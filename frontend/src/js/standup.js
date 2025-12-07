// // Emoji 选择功能
// document.addEventListener('DOMContentLoaded', function() {
//     const emojiButtons = document.querySelectorAll('.emoji-btn');

//     emojiButtons.forEach(button => {
//         button.addEventListener('click', function() {
//             // 获取当前行的所有按钮
//             const row = this.closest('.pulse-row');
//             const rowButtons = row.querySelectorAll('.emoji-btn');

//             // 移除同一行其他按钮的选中状态
//             rowButtons.forEach(btn => btn.classList.remove('selected'));

//             // 添加当前按钮的选中状态
//             this.classList.add('selected');
//         });
//     });

//     // Save 按钮功能
//     const saveBtn = document.querySelector('.save-btn');
//     if (saveBtn) {
//         saveBtn.addEventListener('click', function() {
//             const statusText = document.querySelector('.standup-textarea').value;
//             const personalPulse = document.querySelector('.pulse-row:nth-child(2) .emoji-btn.selected');
//             const teamPulse = document.querySelector('.pulse-row:nth-child(3) .emoji-btn.selected');
//             const coursePulse = document.querySelector('.pulse-row:nth-child(4) .emoji-btn.selected');

//             // 这里可以添加保存逻辑
//             console.log('Status Report:', statusText);
//             console.log('Personal Pulse:', personalPulse ? personalPulse.textContent : 'Not selected');
//             console.log('Team Pulse:', teamPulse ? teamPulse.textContent : 'Not selected');
//             console.log('Course Pulse:', coursePulse ? coursePulse.textContent : 'Not selected');

//             // 显示保存成功提示
//             this.textContent = 'Saved!';
//             this.style.background = '#4caf50';

//             setTimeout(() => {
//                 this.textContent = 'Save';
//                 this.style.background = '#5e4e99';
//             }, 2000);
//         });
//     }
// });