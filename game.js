'use strict';
const G = (() => {
  // ── Canvas ────────────────────────────────────────────────
  const cv = document.getElementById('gc');
  const cx = cv.getContext('2d');
  const CW = 512, CH = 288, T = 16;
  cv.width = CW; cv.height = CH;

  function resize() {
    const touch  = window.matchMedia('(pointer:coarse)').matches;
    const ctrlH  = touch ? 160 : 0;
    const availW = window.innerWidth;
    const availH = window.innerHeight - ctrlH;
    const scale  = Math.min(availW / CW, availH / CH);
    const cw     = Math.floor(scale * CW);
    const ch     = Math.floor(scale * CH);
    const cl     = Math.floor((availW - cw) / 2);
    cv.style.width  = cw + 'px';
    cv.style.height = ch + 'px';
    cv.style.left   = cl + 'px';
    cv.style.top    = '0px';
    const bg = document.getElementById('bg-scene');
    if (bg) {
      bg.style.left   = cl + 'px';
      bg.style.top    = '0px';
      bg.style.width  = cw + 'px';
      bg.style.height = ch + 'px';
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Keys ──────────────────────────────────────────────────
  const keys = {};
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    if (mazeActive) {
      const m = {ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
      if (m[e.key]) { const [dr,dc] = m[e.key]; mazeMove(mz.r+dr, mz.c+dc); }
    }
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  // ── Questions ─────────────────────────────────────────────
  const W1Q = [
    {ey:'Vùng Dữ Liệu · Phân loại rác',q:'Sau giờ ra chơi, Minh nhìn thấy một chai nhựa đã uống hết nước và được rửa sạch. Theo em, Minh nên bỏ chai nhựa đó vào đâu để bảo vệ môi trường?',o:['Thùng rác hữu cơ','Thùng rác tái chế','Thùng rác nguy hại'],c:1},
    {ey:'Vùng Dữ Liệu · Phân loại rác',q:'Trong giờ ăn nhẹ, Lan ăn xong một quả chuối và còn lại vỏ chuối. Theo em, Lan nên bỏ vỏ chuối vào loại thùng rác nào là phù hợp nhất?',o:['Thùng rác hữu cơ','Thùng rác tái chế','Thùng rác nguy hại'],c:0},
    {ey:'Vùng Dữ Liệu · Phân loại rác',q:'Khi dọn bàn học ở nhà, Nam phát hiện một viên pin cũ đã hết điện. Theo em, Nam nên xử lý viên pin đó như thế nào để an toàn cho môi trường?',o:['Bỏ vào thùng rác nguy hại','Bỏ vào thùng rác hữu cơ','Bỏ chung với giấy vụn'],c:0},
    {ey:'Vùng Dữ Liệu · Phân loại rác',q:'Ở lớp học, cô giáo nhắc học sinh thu gom giấy báo cũ và giấy in một mặt để tái sử dụng hoặc tái chế. Theo em, loại rác này nên được bỏ vào đâu?',o:['Thùng rác tái chế','Thùng rác hữu cơ','Thùng rác nguy hại'],c:0},
    {ey:'Vùng Dữ Liệu · Phân loại rác',q:'Khi dọn dẹp nhà kho, bố của An tìm thấy một bóng đèn bị vỡ. Theo em, gia đình An nên phân loại bóng đèn này vào nhóm rác nào?',o:['Rác tái chế','Rác hữu cơ','Rác nguy hại'],c:2},
    {ey:'Vùng Dữ Liệu · Hành động xanh',q:'Sau khi uống nước xong, một bạn học sinh định vứt cốc nhựa ngay xuống sân trường vì nghĩ rằng lao công sẽ dọn sau. Theo em, bạn học sinh đó nên làm gì là đúng nhất?',o:['Để nguyên trên ghế đá','Bỏ đúng nơi quy định hoặc đúng thùng phân loại','Ném vào bồn cây cho khuất mắt'],c:1},
    {ey:'Vùng Dữ Liệu · Hành động xanh',q:'Trong khi rửa tay, Hùng thấy nước vẫn chảy mạnh dù mình đã rửa xong. Theo em, việc Hùng nên làm ngay lúc đó là gì?',o:['Để nước chảy tiếp cho sạch bồn rửa','Khóa vòi nước lại để tiết kiệm nước','Bỏ đi ngay vì không phải việc của mình'],c:1},
    {ey:'Vùng Dữ Liệu · Hành động xanh',q:'Một lớp học muốn giảm lượng rác nhựa dùng một lần trong tuần lễ Trường học Xanh. Theo em, việc làm nào dưới đây là phù hợp nhất?',o:['Mỗi bạn mang theo bình nước cá nhân','Mỗi bạn dùng thêm nhiều cốc nhựa hơn','Mỗi bạn bỏ chai nhựa xuống ngăn bàn'],c:0},
    {ey:'Vùng Dữ Liệu · Hành động xanh',q:'Trong giờ trực nhật, tổ của Mai thấy ở góc lớp có một số mẩu giấy nhỏ bị rơi xuống đất. Theo em, việc làm nào thể hiện ý thức bảo vệ môi trường học đường tốt nhất?',o:['Chờ cuối tuần mới nhặt','Nhặt lên và bỏ vào đúng thùng rác','Quét dọn vào gầm bàn cho đỡ thấy'],c:1},
    {ey:'Vùng Dữ Liệu · Hành động xanh',q:'Ở công viên gần nhà, một bạn nhỏ bẻ cành cây để chơi vì nghĩ cây sẽ mọc lại. Theo em, hành động nào dưới đây là đúng hơn?',o:['Khuyên bạn không bẻ cành cây và cùng bảo vệ cây xanh','Bẻ thêm lá để chơi cho vui','Không quan tâm vì cây không phải của mình'],c:0},
    {ey:'Vùng Dữ Liệu · Nhận thức môi trường',q:'Rác thải điện tử như pin, dây sạc, thiết bị điện hỏng nếu bị vứt bừa bãi có thể gây ảnh hưởng xấu nhất đến điều gì?',o:['Đất và nguồn nước','Chỉ làm bẩn bàn học','Không gây ảnh hưởng gì đáng kể'],c:0},
    {ey:'Vùng Dữ Liệu · Nhận thức môi trường',q:'Cây xanh thường được trồng nhiều ở sân trường, công viên và ven đường. Theo em, lợi ích quan trọng của cây xanh đối với môi trường là gì?',o:['Làm cho không khí trong lành hơn','Làm tăng lượng rác trong sân','Làm cho trời nóng hơn'],c:0},
    {ey:'Vùng Dữ Liệu · Nhận thức môi trường',q:'Một khu dân cư có người đổ rác thải xuống kênh mương. Theo em, hậu quả nào sau đây có thể xảy ra trong thực tế?',o:['Nước bị ô nhiễm và dễ phát sinh mùi hôi','Nước trở nên sạch hơn','Cá và cây cối phát triển tốt hơn ngay lập tức'],c:0},
    {ey:'Vùng Dữ Liệu · Nhận thức môi trường',q:'Trong các hoạt động hàng ngày, việc tắt đèn và quạt khi ra khỏi phòng có ý nghĩa gì đối với môi trường?',o:['Giúp tiết kiệm điện năng và giảm lãng phí tài nguyên','Làm lớp học tối hơn nên không tốt','Không có tác dụng gì'],c:0},
    {ey:'Vùng Dữ Liệu · Nhận thức môi trường',q:'Khi gia đình đi chợ, mẹ của Vy thường mang theo túi vải dùng nhiều lần thay vì lấy nhiều túi ni-lông mới. Theo em, việc làm đó giúp ích gì cho môi trường?',o:['Giảm lượng rác nhựa thải ra','Tăng lượng túi ni-lông sử dụng','Không tạo ra sự thay đổi nào'],c:0},
    {ey:'Vùng Dữ Liệu · Tình huống thực tế',q:'Trong lớp học, Bình thấy bạn mình vừa ăn bánh xong và định bỏ vỏ bánh vào thùng rác tái chế. Nếu là Bình, em nên nhắc bạn như thế nào cho đúng?',o:['Bạn hãy bỏ vỏ bánh vào thùng rác phù hợp, vì loại rác này thường không phải là rác tái chế.','Bạn cứ bỏ đâu cũng được, miễn là nhanh.','Bạn nên giấu xuống ngăn bàn để lát sau tính.'],c:0},
    {ey:'Vùng Dữ Liệu · Tình huống thực tế',q:'Ở nhà, sau khi thay hộp mực máy in cũ, bố của Khôi đang phân vân chưa biết bỏ ở đâu. Theo em, hộp mực in cũ nên được xử lý như thế nào?',o:['Bỏ vào nhóm rác nguy hại hoặc nơi thu gom phù hợp','Bỏ chung với rau thừa','Bỏ chung với giấy báo cũ'],c:0},
    {ey:'Vùng Dữ Liệu · Tình huống thực tế',q:'Trong một buổi lao động, các bạn học sinh phát hiện có lá cây khô, vỏ trái cây và giấy vụn nằm lẫn vào nhau. Theo em, nhóm nào dưới đây phân loại đúng nhất?',o:['Lá cây khô và vỏ trái cây là rác hữu cơ; giấy vụn là rác tái chế','Tất cả đều là rác nguy hại','Tất cả đều là rác hữu cơ'],c:0},
    {ey:'Vùng Dữ Liệu · Tình huống thực tế',q:'Nhà trường tổ chức phong trào "Mỗi lớp một hành động xanh". Theo em, lớp học nên chọn việc làm nào sau đây để vừa thiết thực vừa dễ thực hiện?',o:['Phân loại rác trong lớp và nhắc nhau tắt điện khi không sử dụng','Dùng thật nhiều đồ nhựa dùng một lần cho tiện','Để giấy vụn rơi dưới sàn rồi cuối tháng dọn một lần'],c:0},
    {ey:'Vùng Dữ Liệu · Tình huống thực tế',q:'Khi trời mưa lớn, nhiều rác bị cuốn vào miệng cống trước cổng trường. Theo em, việc này có thể gây ra hậu quả gì trong thực tế?',o:['Làm tắc cống và dễ gây ngập nước','Làm cho nước thoát nhanh hơn','Không ảnh hưởng gì đến khu vực xung quanh'],c:0},
  ];

  const W2Q = [
    {ey:'Vùng Giải Mã · Giải mã số',q:'Mario tìm thấy dãy nhị phân 01011 trên cánh cửa bí mật. Em hãy đổi dãy số này sang hệ thập phân để mở cửa.',a:11},
    {ey:'Vùng Giải Mã · Giải mã số',q:'Luigi nhìn thấy mã nhị phân 0011 trên một đồng xu phát sáng. Em hãy điền giá trị thập phân tương ứng.',a:3},
    {ey:'Vùng Giải Mã · Giải mã số',q:'Peach gửi cho Mario tín hiệu nhị phân 1001 để kích hoạt ống nước sạch. Em hãy điền số thập phân đúng.',a:9},
    {ey:'Vùng Giải Mã · Giải mã số',q:'Trong phòng điều khiển, Mario nhìn thấy mã nhị phân 0110. Em hãy điền đáp án đúng để hệ thống tiếp tục hoạt động.',a:6},
    {ey:'Vùng Giải Mã · Giải mã số',q:'Bowser khóa cánh cổng bằng dãy nhị phân 11111. Em hãy đổi dãy số đó sang hệ thập phân để mở khóa.',a:31},
    {ey:'Vùng Giải Mã · Dãy số',q:'Bảng năng lượng xanh hiển thị dãy số 1, 2, 4, 8, ?. Em hãy điền số tiếp theo theo đúng quy luật.',a:16},
    {ey:'Vùng Giải Mã · Dãy số',q:'Hệ thống đếm năm xanh của Mario cho dãy số 2, 4, 8, 16, ?. Em hãy tìm số tiếp theo.',a:32},
    {ey:'Vùng Giải Mã · Dãy số',q:'Trong kho dữ liệu, Mario thấy dãy số 3, 6, 12, 24, ?. Em hãy điền số còn thiếu.',a:48},
    {ey:'Vùng Giải Mã · Dãy số',q:'Trên đường ống giải mã, Luigi phát hiện dãy số 1, 3, 9, 27, ?. Em hãy điền số tiếp theo.',a:81},
    {ey:'Vùng Giải Mã · Dãy số',q:'Bảng điều khiển của Toad cho dãy số 2, 5, 8, 11, ?. Em hãy điền số tiếp theo theo quy luật.',a:14},
    {ey:'Vùng Giải Mã · Dãy số',q:'Mario nhìn thấy dãy số 10, 9, 8, 7, ? trên cánh cổng sắt. Em hãy điền số tiếp theo.',a:6},
    {ey:'Vùng Giải Mã · Dãy số',q:'Hệ thống cảnh báo ô nhiễm hiển thị dãy số 5, 10, 15, 20, ?. Em hãy điền số tiếp theo.',a:25},
    {ey:'Vùng Giải Mã · Dãy số',q:'Bộ đếm hạt giống xanh hiện dãy số 1, 1, 2, 3, 5, 8, ?. Em hãy điền số còn thiếu.',a:13},
    {ey:'Vùng Giải Mã · Dãy số',q:'Trong một nhà kính của Hộ Chiếu Xanh, số cây non tăng theo dãy 2, 3, 5, 8, 13, ?. Em hãy điền số tiếp theo.',a:21},
    {ey:'Vùng Giải Mã · Toán xanh',q:'Lâu đài Bowser có 1200 đơn vị rác. Nếu mỗi robot dọn được 300 đơn vị rác, em hãy điền số robot ít nhất cần dùng để dọn sạch hoàn toàn.',a:4},
    {ey:'Vùng Giải Mã · Toán xanh',q:'Đồng cỏ Xanh có 400 đơn vị rác, còn Sa mạc Cát có 800 đơn vị rác. Em hãy điền tổng lượng rác của hai khu vực này.',a:1200},
    {ey:'Vùng Giải Mã · Toán xanh',q:'Ba khu vực có lượng rác lần lượt là 1200, 400 và 800 đơn vị. Em hãy điền tổng lượng rác của cả ba khu vực.',a:2400},
    {ey:'Vùng Giải Mã · Toán xanh',q:'Một đội môi trường đã dọn được 600 đơn vị rác trong ngày thứ nhất và 300 đơn vị rác trong ngày thứ hai. Em hãy điền tổng số đơn vị rác mà đội đã dọn được sau hai ngày.',a:900},
    {ey:'Vùng Giải Mã · Toán xanh',q:'Nếu một vòi nước tiết kiệm được 5 lít nước mỗi giờ, thì trong 4 giờ vòi nước đó sẽ tiết kiệm được bao nhiêu lít nước? Em hãy điền đáp án.',a:20},
    {ey:'Vùng Giải Mã · Toán xanh',q:'Một lớp học trồng 4 chậu cây, mỗi chậu có 3 cây non. Em hãy điền tổng số cây non mà lớp học đã trồng.',a:12},
  ];

  const W3Q = [
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Mario cần vượt qua một hố bẫy nhỏ để đi đến cột cờ. Em hãy sắp xếp đúng trình tự các lệnh sau.',steps:['Bắt đầu','Tiến 2 bước','Nhảy','Về đích']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Mario cần đi qua một con đường có Goomba đứng chặn phía trước. Em hãy sắp xếp đúng trình tự để Mario né Goomba và tiếp tục di chuyển.',steps:['Bắt đầu','Tiến 1 bước','Nhảy cao','Tiến 1 bước']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Hệ thống bơm nước sạch cho rừng Nấm cần hoạt động đúng quy trình. Em hãy sắp xếp các bước sau.',steps:['Bắt đầu','Kiểm tra bồn chứa','Bơm nước','Kết thúc']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Mario cần thu gom rác trong sân trường theo cách đúng nhất. Em hãy sắp xếp các bước sau.',steps:['Bắt đầu','Quan sát loại rác','Nhặt rác','Bỏ rác vào đúng thùng']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Một vòi nước đang bị chảy lãng phí trong khu vườn. Em hãy sắp xếp đúng trình tự hành động sau.',steps:['Bắt đầu','Phát hiện vòi nước đang chảy','Khóa vòi nước','Kiểm tra lại vòi nước']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Mario cần trồng cây xanh trong khu vườn mới. Em hãy sắp xếp đúng trình tự các bước sau.',steps:['Bắt đầu','Đào hố','Đặt cây vào hố','Tưới nước']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Đội môi trường muốn dọn lớp học sạch sẽ. Em hãy sắp xếp đúng quy trình.',steps:['Bắt đầu','Nhặt rác','Phân loại rác','Bỏ rác vào các thùng phù hợp']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Mario cần đưa nước sạch đến Hộ Chiếu Xanh bằng hệ thống có điều kiện. Em hãy sắp xếp các bước sau.',steps:['Bắt đầu','Kiểm tra mức nước','Bơm nước','Nếu bồn đầy thì dừng']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Một nhóm học sinh muốn tái chế giấy cũ trong lớp. Em hãy sắp xếp đúng quy trình.',steps:['Bắt đầu','Thu gom giấy cũ','Kiểm tra giấy còn tái chế được không','Bỏ vào thùng tái chế']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Mario cần hoàn thành nhiệm vụ giải cứu đường ống xanh. Em hãy sắp xếp trình tự sau.',steps:['Bắt đầu','Kiểm tra vị trí rò rỉ','Sửa đường ống bị rò','Mở lại hệ thống nước']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Luigi muốn dọn sạch một góc vườn có lá khô rơi nhiều. Em hãy sắp xếp đúng các bước sau.',steps:['Bắt đầu','Gom lá khô','Xác định loại rác','Bỏ vào thùng rác hữu cơ']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Hệ thống tưới cây thông minh chỉ hoạt động khi đất khô. Em hãy sắp xếp đúng các bước sau.',steps:['Bắt đầu','Kiểm tra độ ẩm đất','Nếu độ ẩm thấp thì bật vòi tưới','Đợi 5 giây']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Mario cần vượt một mê cung ngắn để đến nơi đặt thùng tái chế. Em hãy sắp xếp đúng các lệnh sau.',steps:['Bắt đầu','Tiến 1 bước','Rẽ phải','Tiến 1 bước']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Một lớp học muốn tiết kiệm điện vào cuối ngày. Em hãy sắp xếp đúng trình tự các việc cần làm.',steps:['Bắt đầu','Kiểm tra thiết bị trong lớp','Tắt đèn','Tắt quạt']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Mario phải thu gom rác nguy hại đúng cách. Em hãy sắp xếp đúng các bước sau.',steps:['Bắt đầu','Xác định đó là rác nguy hại','Thu gom cẩn thận','Mang đến điểm thu gom phù hợp']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Để làm sạch khu vực gần cống thoát nước, nhóm học sinh cần làm việc theo đúng trình tự. Em hãy sắp xếp các bước sau.',steps:['Bắt đầu','Nhặt rác quanh miệng cống','Bỏ rác vào đúng nơi quy định','Kiểm tra cống có bị tắc không']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Mario cần khởi động hệ thống lọc không khí trong lâu đài. Em hãy sắp xếp đúng trình tự.',steps:['Bắt đầu','Kiểm tra nguồn điện','Bật máy lọc','Kiểm tra máy đã hoạt động chưa']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Trong một dự án "Lớp học xanh", học sinh cần thực hiện đúng quy trình chăm sóc cây. Em hãy sắp xếp các bước sau.',steps:['Bắt đầu','Quan sát cây','Kiểm tra đất trong chậu','Tưới nước nếu đất khô']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Mario cần hoàn thành chu trình làm sạch khu vui chơi. Em hãy sắp xếp đúng các bước sau.',steps:['Bắt đầu','Nhặt rác','Phân loại rác','Đưa rác đến khu xử lý']},
    {ey:'Vùng Thuật Toán · Sắp xếp lệnh',q:'Hệ thống tưới nước tự động của Hộ Chiếu Xanh hoạt động lặp lại. Em hãy sắp xếp đúng trình tự khối lệnh sau.',steps:['Bắt đầu vòng lặp','Kiểm tra độ ẩm đất','Nếu độ ẩm thấp thì tưới nước','Đợi 5 giây']},
  ];

  const WDATA = [
    {bg:'#5c94fc', gc:'#228b22', bc:'#c84c0c', qc:'#fbd000', width:3520, qs:W1Q, need:20, hasMaze:false},
    {bg:'#1a0a00', gc:'#5c4433', bc:'#3d2b1f', qc:'#fbd000', width:3250, qs:W2Q, need:20, hasMaze:false},
    {bg:'#0a0018', gc:'#1a0038', bc:'#2d0060', qc:'#ffd700', width:3250, qs:W3Q, need:20, hasMaze:false},
  ];

  // ── Maze (World 2) ────────────────────────────────────────
  // 0=path 1=wall 2=goal
  const MAZE_MAP = [
    [0,0,0,1,0,0,0],
    [0,1,0,1,0,1,0],
    [0,0,0,0,0,1,0],
    [1,0,1,1,0,0,0],
    [0,0,0,0,1,0,1],
    [0,1,1,0,0,0,0],
    [0,0,0,0,1,1,2],
  ];
  let mz = {r:0,c:0};
  let mazePath = [];
  let mazeSolved = false;
  let mazeActive = false;

  // ── State ─────────────────────────────────────────────────
  let st = {
    screen: 'overlay',
    world: 0,
    camX: 0,
    coins: 0,
    lives: 3,
    score: 0,
    worldScores: [0,0,0],
    paused: false,
    worldDone: [false,false,false],
    playerName: '',
    playerClass: '',
  };

  // ── Player ────────────────────────────────────────────────
  const p = { x:40, y:220, w:14, h:16, vx:0, vy:0, onGround:false, alive:true, cd:0 };

  // ── Level objects ─────────────────────────────────────────
  let plats=[], qbs=[], ens=[], flagX=0, flagOpen=false, mazeSignX=0;
  let particles=[];
  let walkT=0;

  // ── Level generators ──────────────────────────────────────
  function genW1() {
    // Map dài 3200px. Ground y=256.
    // Quy tắc đặt block:
    //   - Đứng trên ground (p.y=240), nhảy cao ~63px → đầu Mario lên tới y≈177
    //   - Block trên mặt đất: y=192 (đáy block=208, an toàn kích hoạt)
    //   - Đứng trên platform y=208 (p.y=192), nhảy → đầu lên tới y≈129
    //   - Block trên platform: y=160 (đáy=176, an toàn)
    plats = [{x:0,y:256,w:3200,h:32,t:'g'}];
    [
      [160,208,80],
      [480,208,80],
      [720,208,80],
      [1024,208,96],
      [1280,208,64],
      [1536,208,80],
      [1760,208,80],
      [2048,208,96],
      [2304,208,64],
      [2560,208,80],
      [2816,208,80],
    ].forEach(([x,y,w]) => plats.push({x,y,w,h:16,t:'b'}));

    qbs = [];
    [
      [96, 192],[256,192],[620,192],[880,192],[1200,192],
      [1680,192],[1920,192],[2240,192],[2448,192],[2960,192],
      [176,160],[496,160],[736,160],[1040,160],[1296,160],
      [1552,160],[1776,160],[2064,160],[2320,160],[2576,160],
    ].forEach(([x,y],i) => qbs.push({x,y,w:16,h:16,qi:i,done:false}));

    ens = [];
    [350, 650, 950, 1400, 1850, 2200, 2650, 3000
    ].forEach(x => ens.push({x,y:240,w:14,h:14,vx:-0.65,vy:0,alive:true,minX:x-90,maxX:x+90,t:'g'}));
    flagX=3120; flagOpen=false; mazeSignX=0;
    particles=[];
  }

  function genW2() {
    plats = [{x:0,y:256,w:3250,h:32,t:'g'}];
    [[128,208,80],[272,192,80],[432,208,80],[576,192,80],
     [736,208,80],[880,192,80],[1040,208,80],[1184,192,80],
     [1344,208,80],[1488,192,80],[1648,208,80],[1792,192,80],
     [1952,208,80],[2096,192,80],[2256,208,80],[2400,192,80],
     [2560,208,80],[2704,192,80],[2864,208,80],[3008,192,80]
    ].forEach(([x,y,w]) => plats.push({x,y,w,h:16,t:'b'}));
    qbs = [];
    // Mix: y=160 (trên plat y=208), y=144 (trên plat y=192), y=176 (khoảng trống, kích hoạt từ đất)
    [[152,160],[296,144],[390,176],[456,160],[760,160],
     [904,144],[990,176],[1208,144],[1368,160],[1512,144],
     [1590,176],[1672,160],[1816,144],[1976,160],[2120,144],
     [2210,176],[2424,144],[2584,160],[2820,176],[3032,144]
    ].forEach(([x,y],i) => qbs.push({x,y,w:16,h:16,qi:i,done:false}));
    ens = [];
    [200,500,800,1100,1400,1700,2000,2300,2600,2900
    ].forEach(x => ens.push({x,y:240,w:14,h:14,vx:-0.70,vy:0,alive:true,minX:x-80,maxX:x+80,t:'g'}));
    flagX=3180; flagOpen=false; mazeSignX=0;
    mazeSolved=false; mazeActive=false; mz={r:0,c:0}; mazePath=[];
  }

  function genW3() {
    plats = [{x:0,y:256,w:3250,h:32,t:'g'}];
    [[80,208,96],[240,192,64],[384,208,96],[544,192,80],
     [704,208,64],[832,192,96],[1008,208,80],[1152,192,64],
     [1296,208,96],[1456,192,80],[1616,208,64],[1744,192,96],
     [1920,208,80],[2064,192,64],[2208,208,96],[2368,192,80],
     [2528,208,64],[2656,192,96],[2832,208,80],[2976,192,64]
    ].forEach(([x,y,w]) => plats.push({x,y,w,h:16,t:'b'}));
    qbs = [];
    // Mix: y=160 (trên plat y=208), y=144 (trên plat y=192), y=176 (khoảng trống, kích hoạt từ đất)
    [[120,160],[264,144],[340,176],[432,160],[728,160],
     [880,144],[984,176],[1176,144],[1336,160],[1480,144],
     [1590,176],[1640,160],[1784,144],[1952,160],[2088,144],
     [2164,176],[2392,144],[2552,160],[2852,160],[3000,144]
    ].forEach(([x,y],i) => qbs.push({x,y,w:16,h:16,qi:i,done:false}));
    ens = [];
    [200,500,800,1100,1400,1700,2000,2300,2600,2900
    ].forEach(x => ens.push({x,y:240,w:14,h:14,vx:-0.65,vy:0,alive:true,minX:x-80,maxX:x+80,t:'k'}));
    flagX=3180; flagOpen=false; mazeSignX=0;
  }

  const GENS = [genW1, genW2, genW3];

  // ── Draw helpers ──────────────────────────────────────────
  function tile(type, sx, sy) {
    const w = WDATA[st.world];
    if (type==='g') {
      cx.fillStyle='#8b4513'; cx.fillRect(sx,sy,16,16);
      cx.fillStyle=w.gc; cx.fillRect(sx,sy,16,5);
      cx.strokeStyle='rgba(0,0,0,0.25)'; cx.strokeRect(sx+.5,sy+.5,15,15);
    } else if (type==='b') {
      cx.fillStyle=w.bc; cx.fillRect(sx,sy,16,16);
      cx.strokeStyle='rgba(0,0,0,0.35)';
      cx.strokeRect(sx+.5,sy+.5,7,7); cx.strokeRect(sx+8.5,sy+.5,7,7);
      cx.strokeRect(sx+.5,sy+8.5,7,7); cx.strokeRect(sx+8.5,sy+8.5,7,7);
    } else if (type==='q') {
      // Nền vàng cam
      cx.fillStyle='#e8a000'; cx.fillRect(sx,sy,16,16);
      // Highlight trên-trái
      cx.fillStyle='#ffd84d'; cx.fillRect(sx,sy,16,2); cx.fillRect(sx,sy,2,16);
      // Bóng dưới-phải
      cx.fillStyle='#7a4800'; cx.fillRect(sx,sy+14,16,2); cx.fillRect(sx+14,sy,2,16);
      // Dấu ? pixel art — ô 2×2, pattern 4 cột × 5 hàng, offset (3,2) trong block
      // Pattern: (col,row) → 0-indexed
      // .##.   row0
      // #..#   row1
      // ..#.   row2
      // .#..   row3
      // (gap)
      // .#..   row5 (chấm)
      cx.fillStyle='#3a1a00';
      // 3 cột × 6 hàng, cell 2×2, căn giữa block 16×16
      [[0,0],[1,0],[2,0],  // ###
       [2,1],              // ..#
       [1,2],[2,2],        // .##
       [1,3],              // .#.
                           // gap
       [1,5]               // dot
      ].forEach(([c,r])=>cx.fillRect(sx+5+c*2, sy+2+r*2, 2, 2));
    } else if (type==='u') {
      cx.fillStyle='#555'; cx.fillRect(sx,sy,16,16);
      cx.fillStyle='#777'; cx.fillRect(sx,sy,16,2); cx.fillRect(sx,sy,2,16);
      cx.fillStyle='#333'; cx.fillRect(sx,sy+14,16,2); cx.fillRect(sx+14,sy,2,16);
    }
  }

  function drawBg() {
    const w = WDATA[st.world];
    cx.fillStyle = w.bg; cx.fillRect(0,0,CW,CH);
    if (st.world===0) {
      cx.fillStyle='rgba(255,255,255,0.75)';
      for (let i=0;i<5;i++) {
        const sx = ((i*210 - st.camX*0.25 + 2000) % (CW+200)) - 100;
        const sy = 35+i*18;
        cx.fillRect(sx,sy,44,14); cx.fillRect(sx+8,sy-8,28,12);
      }
      cx.fillStyle='#228b22';
      cx.fillRect(0,254,CW,CH-254);
    }
    if (st.world===1) {
      cx.fillStyle='rgba(255,60,0,0.12)';
      cx.fillRect(0,CH-60,CW,60);
      for (let x=0;x<CW;x+=8) {
        const h = 8+Math.sin(x*0.15+st.camX*0.01)*4;
        cx.fillStyle=`rgba(255,${Math.floor(80+Math.sin(x*0.2)*40)},0,0.6)`;
        cx.fillRect(x, CH-h, 7, h);
      }
    }
    if (st.world===2) {
      cx.fillStyle='rgba(255,255,255,0.5)';
      for (let i=0;i<35;i++) {
        const sx=((i*137+Math.floor(st.camX*0.15))%CW+CW)%CW;
        const sy=(i*67)%(CH-50)+8;
        cx.fillRect(sx,sy,i%3===0?3:2,i%3===0?3:2);
      }
    }
  }

  function drawMario() {
    if (!p.alive) return;
    const sx=Math.round(p.x-st.camX), sy=Math.round(p.y);
    const moving = p.onGround && Math.abs(p.vx)>0.3;
    if(moving) walkT++;
    const wf = Math.floor(walkT/7)%2; // 0 or 1, alternates every 7 frames
    // hat + body
    cx.fillStyle='#e52222'; cx.fillRect(sx+2,sy,10,4); cx.fillRect(sx+2,sy+4,10,8);
    cx.fillStyle='#c84c0c'; cx.fillRect(sx,sy+2,14,2);
    // face
    cx.fillStyle='#f5c085'; cx.fillRect(sx+3,sy+4,8,5);
    cx.fillStyle='#000'; cx.fillRect(sx+5,sy+5,2,2); cx.fillRect(sx+8,sy+5,2,2);
    cx.fillStyle='#c84c0c'; cx.fillRect(sx+6,sy+7,2,1);
    // overalls
    cx.fillStyle='#0044cc'; cx.fillRect(sx+2,sy+9,10,5);
    cx.fillStyle='#ffd700'; cx.fillRect(sx+4,sy+10,2,2); cx.fillRect(sx+8,sy+10,2,2);
    // boots — alternate frame for walk cycle
    const lbo = (moving && wf===0) ? 1 : 0; // left boot offset
    const rbo = (moving && wf===1) ? 1 : 0; // right boot offset
    cx.fillStyle='#8b3000';
    cx.fillRect(sx+1, sy+13-lbo, 5, 3);
    cx.fillRect(sx+8, sy+13-rbo, 5, 3);
  }

  function drawGoomba(e) {
    const sx=e.x-st.camX|0, sy=e.y|0;
    if (sx<-20||sx>CW+20) return;
    cx.fillStyle='#8b3000'; cx.fillRect(sx,sy,14,8);
    cx.fillStyle='#c84c0c'; cx.fillRect(sx+1,sy+6,12,9);
    cx.fillStyle='#fff'; cx.fillRect(sx+3,sy+2,3,3); cx.fillRect(sx+8,sy+2,3,3);
    cx.fillStyle='#000'; cx.fillRect(sx+4,sy+3,2,2); cx.fillRect(sx+9,sy+3,2,2);
    cx.fillStyle='#8b3000'; cx.fillRect(sx+1,sy+12,4,2); cx.fillRect(sx+9,sy+12,4,2);
    cx.fillStyle='#fff'; cx.fillRect(sx+3,sy+10,3,2); cx.fillRect(sx+9,sy+10,3,2);
  }

  function drawKoopa(e) {
    const sx=e.x-st.camX|0, sy=e.y|0;
    if (sx<-20||sx>CW+20) return;
    cx.fillStyle='#228b22'; cx.fillRect(sx+2,sy+2,10,12);
    cx.fillStyle='#8b8000'; cx.fillRect(sx+3,sy+3,8,8);
    cx.fillStyle='#f5c085'; cx.fillRect(sx+3,sy,8,5);
    cx.fillStyle='#000'; cx.fillRect(sx+5,sy+1,2,2); cx.fillRect(sx+9,sy+1,2,2);
    cx.fillStyle='#f5c085'; cx.fillRect(sx+1,sy+12,4,3); cx.fillRect(sx+9,sy+12,4,3);
  }

  function drawFlag() {
    const sx=flagX-st.camX|0;
    if (sx<-60||sx>CW+60) return;
    cx.fillStyle='#aaa'; cx.fillRect(sx+7,100,3,156);
    cx.fillStyle=flagOpen?'#00cc00':'#cc0000';
    cx.fillRect(sx+10,100,22,14);
    cx.fillStyle='#ffd700';
    cx.beginPath(); cx.arc(sx+8,100,5,0,Math.PI*2); cx.fill();
    if (!flagOpen) {
      cx.fillStyle='rgba(255,0,0,0.6)';
      cx.font='9px monospace'; cx.fillText('🔒',sx-4,95);
    }
  }

  function drawMazeSign() {
    if (!mazeSignX) return;
    const sx=mazeSignX-st.camX|0;
    if (sx<-80||sx>CW+80) return;
    cx.fillStyle='#8b4513'; cx.fillRect(sx+8,208,4,48);
    cx.fillStyle='#ffd700'; cx.fillRect(sx-16,192,48,20);
    cx.fillStyle='#000'; cx.font='7px monospace';
    const txt = st.coins>=4?'MAZE →':'?? MAZE';
    cx.fillText(txt, sx-12, 205);
  }

  function drawHUD() {
    const H=24;
    cx.fillStyle='#000'; cx.fillRect(0,0,CW,H);
    cx.fillStyle='#ffd700'; cx.fillRect(0,H-1,CW,1);

    // ── Tên (trái) ──
    cx.font='bold 10px monospace';
    cx.fillStyle='#fff';
    cx.fillText((st.playerName||'MARIO').slice(0,14), 5, 15);

    // ── Coin + star (phải) ──
    const wd=WDATA[st.world];
    const label=`${st.coins}/${wd.need}`;
    cx.font='bold 10px monospace';
    const lw=Math.round(cx.measureText(label).width);
    cx.fillStyle='#ffd700';
    cx.fillText(label, CW-5-lw, 15);
    // ngôi sao trái text
    const srx=CW-5-lw-12, sry=12;
    cx.fillStyle='#ffd700'; cx.strokeStyle='#b87800'; cx.lineWidth=1;
    cx.beginPath();
    for(let i=0;i<5;i++){
      const oa=(i*4*Math.PI/5)-Math.PI/2, ia=oa+Math.PI/5;
      i===0?cx.moveTo(Math.round(srx+5*Math.cos(oa)),Math.round(sry+5*Math.sin(oa)))
           :cx.lineTo(Math.round(srx+5*Math.cos(oa)),Math.round(sry+5*Math.sin(oa)));
      cx.lineTo(Math.round(srx+2*Math.cos(ia)),Math.round(sry+2*Math.sin(ia)));
    }
    cx.closePath(); cx.fill(); cx.stroke();

    // ── 3 trái tim pixel art (giữa) ──
    const HB=[
      [0,1,1,0,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
      [0,0,1,1,1,0,0],
      [0,0,0,1,0,0,0],
    ];
    const heartW=14, gap=5;
    const tx=Math.round(CW/2-(heartW*3+gap*2)/2);
    const ty=Math.round((24-12)/2);
    for(let i=0;i<3;i++){
      const alive=i<st.lives;
      const hx=tx+i*(heartW+gap);
      HB.forEach((row,r)=>row.forEach((v,c)=>{
        if(!v)return;
        let col;
        if(!alive)                      col='#2a2a2a';
        else if(r===0&&(c===1||c===4))  col='#ff9999';
        else if(r===5)                  col='#990000';
        else if(r>=3)                   col='#cc1111';
        else                            col='#ee2222';
        cx.fillStyle=col;
        cx.fillRect(hx+c*2, ty+r*2, 2, 2);
      }));
    }
  }

  // ── Physics ────────────────────────────────────────────────
  const GRAV=0.25, JVY=-5.5, WSPD=1.8, MFALL=8;

  function overlap(ax,ay,aw,ah,bx,by,bw,bh) {
    return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
  }

  function resolveAABB(ax,ay,aw,ah,bx,by,bw,bh) {
    const ox=Math.min(ax+aw,bx+bw)-Math.max(ax,bx);
    const oy=Math.min(ay+ah,by+bh)-Math.max(ay,by);
    return {ox,oy};
  }

  function updatePlayer() {
    if (!p.alive) { if(p.cd>0) p.cd--; return; }
    const L=keys['ArrowLeft']||keys['a']||keys['A'];
    const R=keys['ArrowRight']||keys['d']||keys['D'];
    const J=keys['ArrowUp']||keys['w']||keys['W']||keys[' '];
    if(L){p.vx-=0.22;}
    if(R){p.vx+=0.22;}
    if(!L&&!R) p.vx*=0.72;
    p.vx=Math.max(-WSPD,Math.min(WSPD,p.vx));
    if(J&&p.onGround){p.vy=JVY; p.onGround=false;}
    p.vy=Math.min(p.vy+GRAV,MFALL);
    p.x+=p.vx; p.y+=p.vy;
    p.onGround=false;
    const ww=WDATA[st.world].width;
    if(p.x<0){p.x=0;p.vx=0;}
    if(p.x+p.w>ww){p.x=ww-p.w;p.vx=0;}
    if(p.y>CH+30){loseLife();return;}

    // Platform collision
    for(const pl of plats) {
      if(!overlap(p.x,p.y,p.w,p.h,pl.x,pl.y,pl.w,pl.h)) continue;
      const {ox,oy}=resolveAABB(p.x,p.y,p.w,p.h,pl.x,pl.y,pl.w,pl.h);
      if(oy<=ox+0.5) {
        if(p.vy>=0){p.y=pl.y-p.h;p.vy=0;p.onGround=true;}
        else{p.y=pl.y+pl.h;p.vy=1;}
      } else {
        if(p.vx>0)p.x=pl.x-p.w; else p.x=pl.x+pl.w; p.vx=0;
      }
    }

    // ? block collision — giữ vật lý kể cả khi đã done (grey)
    for(const qb of qbs) {
      if(!overlap(p.x,p.y,p.w,p.h,qb.x,qb.y,qb.w,qb.h)) continue;
      const {ox,oy}=resolveAABB(p.x,p.y,p.w,p.h,qb.x,qb.y,qb.w,qb.h);
      if(oy<=ox+0.5) {
        if(p.vy>=0){p.y=qb.y-p.h;p.vy=0;p.onGround=true;}
        else{
          p.y=qb.y+qb.h; p.vy=2;
          if(!qb.done) triggerQ(qb);
        }
      } else {
        if(p.vx>0)p.x=qb.x-p.w; else p.x=qb.x+qb.w; p.vx=0;
      }
    }

    // Flag touch
    if(flagOpen && p.x+p.w>flagX && p.x<flagX+30) {
      worldComplete(); return;
    }

    // Maze sign (World 2)
    if(mazeSignX && !mazeSolved &&
       p.x+p.w>mazeSignX && p.x<mazeSignX+48 && p.onGround) {
      triggerMaze();
    }
  }

  function updateEnemies() {
    for(const e of ens) {
      if(!e.alive) continue;
      e.x+=e.vx;
      e.vy=Math.min(e.vy+GRAV,MFALL); e.y+=e.vy;

      // Quay đầu khi ra ngoài vùng patrol
      if(e.x<=e.minX){e.x=e.minX;e.vx=Math.abs(e.vx);}
      if(e.x+e.w>=e.maxX){e.x=e.maxX-e.w;e.vx=-Math.abs(e.vx);}

      // Platform collision
      for(const pl of plats) {
        if(!overlap(e.x,e.y,e.w,e.h,pl.x,pl.y,pl.w,pl.h)) continue;
        const {ox,oy}=resolveAABB(e.x,e.y,e.w,e.h,pl.x,pl.y,pl.w,pl.h);
        if(oy<=ox+0.5) {
          if(e.vy>=0){e.y=pl.y-e.h;e.vy=0;}
        } else {
          e.vx*=-1;
          e.x=e.vx>0?pl.x+pl.w:pl.x-e.w;
        }
      }

      if(e.y>CH+30){e.alive=false;continue;}
      if(p.alive&&p.cd<=0&&overlap(p.x,p.y,p.w,p.h,e.x,e.y,e.w,e.h)) {
        if(p.vy>0&&p.y+p.h<e.y+e.h*0.6){
          e.alive=false; p.vy=-5;
          st.score+=100;
          particles.push({type:'score',x:e.x+e.w/2,y:e.y-2,vy:-1.8,life:42,maxLife:42});
        }
        else{loseLife();}
      }
    }
  }

  function updateCam() {
    const ww=WDATA[st.world].width;
    state_camX_target = p.x - CW/3;
    const maxCam = Math.min(ww-CW, flagX - CW + 80);
    st.camX=Math.max(0,Math.min(state_camX_target, maxCam));
  }
  let state_camX_target=0;

  let deathCamX=0;
  function loseLife() {
    deathCamX=st.camX;
    st.lives--;
    st.score=Math.max(0,st.score-100);
    p.alive=false; p.cd=90;
    if(st.lives<=0) {
      setTimeout(()=>showGameOver('lives'),1500);
    } else {
      setTimeout(()=>resetPlayer(false),1200);
    }
  }

  function showGameOver(reason) {
    st.screen='overlay';
    document.getElementById('qOverlay').classList.add('hidden');
    showOvl('sGameOver');
  }

  function resetPlayer(fullReset) {
    if(fullReset) {
      p.x=40; st.camX=0;
    } else {
      st.camX=deathCamX;
      p.x=Math.max(40, deathCamX+20);
    }
    p.y=240; p.vx=0; p.vy=0; p.onGround=false; p.alive=true; p.cd=0;
    walkT=0;
  }

  // ── Question popup ────────────────────────────────────────
  let qPaused=false, activeQB=null, pendingParticle=null, pendingDone=null, pendingCoin=false;

  function triggerQ(qb) {
    activeQB=qb;
    qPaused=true;
    const q=WDATA[st.world].qs[qb.qi];
    document.getElementById('qEyebrow').textContent=q.ey||'Câu hỏi';
    document.getElementById('qText').textContent=q.q;
    document.getElementById('qFb').textContent='';
    document.getElementById('qFb').className='qfb';
    document.getElementById('budgetUI').classList.remove('show');
    document.getElementById('mazeUI').style.display='none';
    document.getElementById('seqUI').style.display='none';
    document.getElementById('numUI').style.display='none';
    const el=document.getElementById('qOpts');
    el.innerHTML='';
    if(q.o) {
      // MCQ (World 1)
      q.o.forEach((opt,i)=>{
        const b=document.createElement('button');
        b.className='qopt'; b.textContent=opt;
        b.onclick=()=>answerQ(i,q.c,b);
        el.appendChild(b);
      });
    } else if(q.a!==undefined) {
      // Fill-in number (World 2)
      const inp=document.getElementById('numInput');
      inp.value='';
      document.getElementById('numUI').style.display='block';
      document.getElementById('numSubmit').disabled=false;
      document.getElementById('numSubmit').onclick=()=>{
        const val=parseInt(inp.value.trim(),10);
        answerNum(val,q.a);
      };
      inp.onkeydown=e=>{ if(e.key==='Enter') answerNum(parseInt(inp.value.trim(),10),q.a); };
    } else if(q.steps) {
      // Sort (World 3)
      renderSortUI(q.steps);
    }
    document.getElementById('qOverlay').classList.remove('hidden');
    if(q.a!==undefined) setTimeout(()=>document.getElementById('numInput').focus(),100);
  }

  function answerQ(chosen,correct,btn) {
    document.querySelectorAll('.qopt').forEach(b=>b.disabled=true);
    const fb=document.getElementById('qFb');
    if(chosen===correct) {
      btn.classList.add('correct');
      fb.textContent='✓ Chính xác! +1 ⭐'; fb.className='qfb ok';
      // Lưu lại — cả done và star spawn SAU khi overlay tắt
      pendingDone=activeQB;
      pendingParticle={x:activeQB.x+8, y:activeQB.y-4};
      pendingCoin=true;
      setTimeout(closeQ,1200);
    } else {
      btn.classList.add('wrong');
      st.score=Math.max(0,st.score-50);
      if(st.score<=0) {
        fb.textContent='✗ Sai rồi! Điểm về 0 — thua cuộc!'; fb.className='qfb bad';
        setTimeout(()=>{ closeQ(); showGameOver('score'); },1600);
      } else {
        fb.textContent=`✗ Sai rồi! -50 điểm.`; fb.className='qfb bad';
        setTimeout(closeQ,1400);
      }
    }
  }

  function answerNum(val,correct) {
    const fb=document.getElementById('qFb');
    document.getElementById('numSubmit').disabled=true;
    if(val===correct) {
      fb.textContent='✓ Chính xác! +1 ⭐'; fb.className='qfb ok';
      pendingDone=activeQB;
      pendingParticle={x:activeQB.x+8,y:activeQB.y-4};
      pendingCoin=true;
      setTimeout(closeQ,1200);
    } else {
      st.score=Math.max(0,st.score-50);
      if(st.score<=0){
        fb.textContent='✗ Sai rồi! Điểm về 0 — thua cuộc!'; fb.className='qfb bad';
        setTimeout(()=>{ closeQ(); showGameOver('score'); },1600);
      } else {
        fb.textContent=`✗ Sai rồi! -50 điểm.`; fb.className='qfb bad';
        setTimeout(closeQ,1400);
      }
    }
  }

  let sortItems=[], sortSlots=[], sortTouchDrag=null, sortTouchGhost=null;

  function renderSortUI(correctSteps) {
    sortItems=correctSteps.map((s,i)=>({text:s,origIdx:i}));
    for(let i=sortItems.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [sortItems[i],sortItems[j]]=[sortItems[j],sortItems[i]];
    }
    sortSlots=new Array(correctSteps.length).fill(-1);
    document.getElementById('seqUI').style.display='block';
    renderSortView();
  }

  function renderSortView() {
    const placed=new Set(sortSlots.filter(x=>x>=0));
    const srcEl=document.getElementById('sortSource');
    srcEl.innerHTML='';
    srcEl.ondragover=e=>e.preventDefault();
    srcEl.ondrop=e=>{
      e.preventDefault();
      const d=JSON.parse(e.dataTransfer.getData('sort'));
      if(d.from>=0){ sortSlots[d.from]=-1; renderSortView(); }
    };
    sortItems.forEach((item,i)=>{
      if(placed.has(i)) return;
      const b=document.createElement('div');
      b.className='sort-block'; b.textContent=item.text; b.draggable=true;
      b.ondragstart=e=>{ e.dataTransfer.setData('sort',JSON.stringify({i,from:-1})); b.classList.add('dragging'); };
      b.ondragend=()=>b.classList.remove('dragging');
      b.ontouchstart=e=>sortTouchStart(e,i,-1,b);
      srcEl.appendChild(b);
    });
    const slEl=document.getElementById('sortSlots');
    slEl.innerHTML='';
    sortSlots.forEach((itemIdx,si)=>{
      const slot=document.createElement('div');
      slot.className='sort-slot'+(itemIdx>=0?' filled':'');
      slot.dataset.slot=si;
      slot.ondragover=e=>{ e.preventDefault(); slot.classList.add('drag-over'); };
      slot.ondragleave=()=>slot.classList.remove('drag-over');
      slot.ondrop=e=>{
        e.preventDefault(); slot.classList.remove('drag-over');
        const d=JSON.parse(e.dataTransfer.getData('sort'));
        const prev=sortSlots[si];
        if(d.from>=0) sortSlots[d.from]=prev; else if(prev>=0) {} // displaced goes to source
        sortSlots[si]=d.i;
        renderSortView();
      };
      if(itemIdx>=0){
        slot.textContent=sortItems[itemIdx].text; slot.draggable=true;
        slot.ondragstart=e=>{ e.dataTransfer.setData('sort',JSON.stringify({i:itemIdx,from:si})); slot.classList.add('dragging'); };
        slot.ondragend=()=>slot.classList.remove('dragging');
        slot.ontouchstart=e=>sortTouchStart(e,itemIdx,si,slot);
      }
      slEl.appendChild(slot);
    });
  }

  function sortTouchStart(e,itemIdx,fromSlot,el) {
    e.preventDefault();
    sortTouchDrag={itemIdx,fromSlot};
    sortTouchGhost=document.createElement('div');
    sortTouchGhost.className='sort-ghost'; sortTouchGhost.textContent=sortItems[itemIdx].text;
    document.body.appendChild(sortTouchGhost);
    el.classList.add('dragging');
    const move=ev=>{ ev.preventDefault(); const t=ev.touches[0]; sortTouchGhost.style.left=t.clientX+'px'; sortTouchGhost.style.top=t.clientY+'px'; };
    const end=ev=>{
      document.removeEventListener('touchmove',move);
      document.removeEventListener('touchend',end);
      el.classList.remove('dragging');
      sortTouchGhost.style.display='none';
      const t=ev.changedTouches[0];
      const under=document.elementFromPoint(t.clientX,t.clientY);
      sortTouchGhost.remove(); sortTouchGhost=null;
      const {itemIdx:di,fromSlot:df}=sortTouchDrag; sortTouchDrag=null;
      const slotEl=under&&under.closest('[data-slot]');
      const inSrc=under&&under.closest('#sortSource');
      if(slotEl){
        const si=parseInt(slotEl.dataset.slot);
        const prev=sortSlots[si];
        if(df>=0) sortSlots[df]=prev;
        sortSlots[si]=di;
      } else if(inSrc||!under){
        if(df>=0) sortSlots[df]=-1;
      } else {
        if(df>=0) sortSlots[df]=di; // cancelled — return to origin
      }
      renderSortView();
    };
    document.addEventListener('touchmove',move,{passive:false});
    document.addEventListener('touchend',end);
    const t0=e.touches[0]; sortTouchGhost.style.left=t0.clientX+'px'; sortTouchGhost.style.top=t0.clientY+'px';
  }

  function checkSort() {
    const fb=document.getElementById('qFb');
    if(sortSlots.some(x=>x<0)){ fb.textContent='Hãy điền vào tất cả các ô!'; fb.className='qfb bad'; return; }
    const ok=sortSlots.every((itemIdx,si)=>sortItems[itemIdx].origIdx===si);
    if(ok){
      fb.textContent='✓ Chính xác! +1 ⭐'; fb.className='qfb ok';
      pendingDone=activeQB; pendingParticle={x:activeQB.x+8,y:activeQB.y-4}; pendingCoin=true;
      setTimeout(closeQ,1200);
    } else {
      st.score=Math.max(0,st.score-50);
      if(st.score<=0){
        fb.textContent='✗ Sai rồi! Điểm về 0 — thua cuộc!'; fb.className='qfb bad';
        setTimeout(()=>{ closeQ(); showGameOver('score'); },1600);
      } else {
        fb.textContent='✗ Thứ tự chưa đúng! -50 điểm.'; fb.className='qfb bad';
        setTimeout(closeQ,1400);
      }
    }
  }

  function sortReset(){ sortSlots.fill(-1); renderSortView(); const fb=document.getElementById('qFb'); fb.textContent=''; fb.className='qfb'; }

  function closeQ() {
    document.getElementById('qOverlay').classList.add('hidden');
    document.getElementById('numUI').style.display='none';
    sortItems=[]; sortSlots=[]; sortTouchDrag=null;
    qPaused=false; activeQB=null;
    if(p.vy<0) p.vy=2;
    // Grey out block + spawn star — cùng lúc, ngay khi overlay vừa tắt
    if(pendingDone) { pendingDone.done=true; pendingDone=null; }
    if(pendingParticle) {
      particles.push({x:pendingParticle.x, y:pendingParticle.y, vy:-2.8, life:55, maxLife:55});
      pendingParticle=null;
    }
    if(pendingCoin) {
      st.coins++;
      const wd=WDATA[st.world];
      if(!wd.hasMaze && st.coins>=wd.need) flagOpen=true;
      pendingCoin=false;
    }
  }

  // ── Maze ──────────────────────────────────────────────────
  function triggerMaze() {
    mazeActive=true; qPaused=true;
    mz={r:0,c:0}; mazePath=[];
    document.getElementById('qEyebrow').textContent='Vùng Giải Mã · Mê cung thu gom';
    document.getElementById('qText').textContent='Dẫn xe rác 🚛 từ S đến R. Dùng phím mũi tên hoặc nhấn ô liền kề.';
    document.getElementById('qOpts').innerHTML='';
    document.getElementById('qFb').textContent='';
    document.getElementById('qFb').className='qfb';
    document.getElementById('budgetUI').classList.remove('show');
    document.getElementById('seqUI').style.display='none';
    document.getElementById('mazeUI').style.display='block';
    renderMaze();
    document.getElementById('qOverlay').classList.remove('hidden');
  }

  function renderMaze() {
    const g=document.getElementById('mazeGrid');
    g.style.gridTemplateColumns='repeat(7,36px)'; g.innerHTML='';
    MAZE_MAP.forEach((row,r)=>row.forEach((cell,c)=>{
      const d=document.createElement('div'); d.className='mcell';
      const isStart=r===0&&c===0, isGoal=cell===2, isWall=cell===1;
      const isCur=mz.r===r&&mz.c===c;
      const onPath=mazePath.some(m=>m.r===r&&m.c===c);
      if(isWall){d.classList.add('wall');d.textContent='👾';}
      else if(isCur){d.classList.add('current');d.textContent='🚛';}
      else if(isGoal){d.classList.add('goal');d.textContent='R';}
      else if(isStart){d.classList.add('start');d.textContent='S';}
      else if(onPath){d.classList.add('path','selected');}
      else{d.classList.add('path');}
      if(!isWall) d.onclick=()=>mazeMove(r,c);
      g.appendChild(d);
    }));
  }

  function mazeMove(r,c) {
    if(mazeSolved) return;
    const dr=Math.abs(r-mz.r), dc=Math.abs(c-mz.c);
    if((dr===1&&dc===0)||(dr===0&&dc===1)) {
      if(MAZE_MAP[r]&&MAZE_MAP[r][c]!==1) {
        mz={r,c}; mazePath.push({r,c});
        if(MAZE_MAP[r][c]===2) {
          mazeSolved=true;
          st.coins++;
          if(st.coins>=WDATA[st.world].need) flagOpen=true;
          const fb=document.getElementById('qFb');
          fb.textContent='✓ Tuyệt vời! Mê cung hoàn thành! 🏁'; fb.className='qfb ok';
          document.querySelectorAll('.mcell').forEach(el=>el.onclick=null);
          setTimeout(()=>{closeQ();mazeActive=false;},1600);
        }
        renderMaze();
      }
    }
  }

  // ── World complete ────────────────────────────────────────
  function worldComplete() {
    if(st.worldDone[st.world]||qPaused) return;
    st.worldDone[st.world]=true;
    st.worldScores[st.world]=st.score;
    qPaused=true;
    setTimeout(()=>{ qPaused=false; G.showComplete(); },2500);
  }

  // ── Overlay helpers ───────────────────────────────────────
  function updateWCards() {
    document.getElementById('sPlayerLbl').textContent=st.playerName+' · '+st.playerClass;
    for(let i=0;i<3;i++){
      const c=document.getElementById('wc'+(i+1));
      const s=document.getElementById('ws'+(i+1));
      if(st.worldDone[i]){c.classList.add('done');s.textContent='✓ Hoàn thành';}
      else{c.classList.remove('done');s.textContent='';}
    }
    document.getElementById('allDoneRow').style.display=st.worldDone.every(Boolean)?'':'none';
  }

  function showOvl(id) {
    ['sIntro','sWorld','sComplete','sGameOver'].forEach(s=>{
      document.getElementById(s).classList.toggle('hidden',s!==id);
    });
    document.getElementById('overlay').classList.remove('hidden');
    cv.style.display='none';
    document.getElementById('mctrl').style.display='none';
  }

  function hideOvl() {
    document.getElementById('overlay').classList.add('hidden');
    cv.style.display='block';
  }

  // ── Game loop ─────────────────────────────────────────────
  let running=false, lastT=0;

  function drawScene() {
    drawBg();
    plats.forEach(pl=>{
      const sx=pl.x-st.camX|0;
      if(sx+pl.w<0||sx>CW) return;
      for(let tx=0;tx<pl.w;tx+=T) tile(pl.t,sx+tx,pl.y);
    });
    qbs.forEach(qb=>{
      const sx=qb.x-st.camX|0;
      if(sx<-20||sx>CW+20) return;
      tile(qb.done?'u':'q',sx,qb.y);
    });
    ens.forEach(e=>{
      if(!e.alive) return;
      if(e.t==='k') drawKoopa(e); else drawGoomba(e);
    });
    drawFlag();
    if(st.world===1) drawMazeSign();
    drawMario();
    // Particles
    particles.forEach(pt => {
      const sx = Math.round(pt.x - st.camX);
      const sy = Math.round(pt.y);
      const alpha = pt.life / pt.maxLife;
      cx.globalAlpha = alpha;
      if(pt.type==='score') {
        cx.fillStyle='#fff';
        cx.font='bold 9px monospace';
        cx.textAlign='center';
        cx.fillText('+100', sx, sy);
        cx.textAlign='left';
      } else {
        cx.fillStyle = '#ffd700';
        cx.strokeStyle = '#ffaa00';
        cx.lineWidth = 1;
        cx.beginPath();
        for(let i=0;i<5;i++){
          const outerA = (i*4*Math.PI/5) - Math.PI/2;
          const innerA = outerA + Math.PI/5;
          const ox = Math.round(sx + 7*Math.cos(outerA));
          const oy = Math.round(sy + 7*Math.sin(outerA));
          const ix = Math.round(sx + 3*Math.cos(innerA));
          const iy = Math.round(sy + 3*Math.sin(innerA));
          i===0 ? cx.moveTo(ox,oy) : cx.lineTo(ox,oy);
          cx.lineTo(ix,iy);
        }
        cx.closePath();
        cx.fill();
        cx.stroke();
      }
      cx.globalAlpha = 1;
    });
    drawHUD();
    if(st.worldDone[st.world]) {
      cx.fillStyle='rgba(255,215,0,0.28)'; cx.fillRect(0,0,CW,CH);
      cx.textAlign='center';
      cx.fillStyle='#ffd700'; cx.font='bold 22px monospace';
      cx.fillText('WORLD CLEAR!',CW/2,CH/2-12);
      cx.fillStyle='#fff'; cx.font='bold 13px monospace';
      cx.fillText(`ĐIỂM: ${st.score}`,CW/2,CH/2+10);
      cx.textAlign='left';
    }
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    if(st.screen!=='game') return;
    // Khóa cứng 60fps: bỏ qua frame nếu chưa đủ ~16ms
    if(ts - lastT < 15) return;
    lastT = ts;
    drawScene();
    if(qPaused) return;
    updatePlayer();
    updateEnemies();
    updateCam();
    // Update particles
    for(let i=particles.length-1;i>=0;i--){
      const pt=particles[i];
      pt.vy+=0.18; pt.y+=pt.vy; pt.life--;
      if(pt.life<=0) particles.splice(i,1);
    }
  }

  // ── Public API ────────────────────────────────────────────
  return {
    startGame() {
      const n=document.getElementById('iName').value.trim();
      const c=document.getElementById('iClass').value.trim();
      if(!n||!c){alert('Vui lòng nhập đầy đủ Họ tên và Lớp!');return;}
      st.playerName=n; st.playerClass=c;
      showOvl('sWorld'); updateWCards();
    },

    enterWorld(w) {
      st.world=w-1; st.coins=0; st.lives=3; st.score=1000;
      qPaused=false; mazeActive=false;
      resetPlayer(true);
      GENS[st.world]();
      st.screen='game';
      hideOvl();
      document.getElementById('qOverlay').classList.add('hidden');
      if(window.matchMedia('(pointer:coarse)').matches)
        document.getElementById('mctrl').style.display='flex';
      const wd=WDATA[st.world];
      document.body.style.background=`linear-gradient(to bottom,${wd.bg} 0%,${wd.gc} 100%)`;
      if(!running){running=true;requestAnimationFrame(loop);}
    },

    goWorldSelect() {
      document.body.style.background='#000';
      st.screen='overlay'; showOvl('sWorld'); updateWCards();
    },

    showComplete() {
      st.screen='overlay';
      const n=st.playerName, c=st.playerClass;
      document.getElementById('scName').textContent=`${n} · ${c}`;
      const ini=(n.split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join(''))||'MS';
      document.getElementById('scCode').textContent=`MS-${ini}-${417+st.world}`;
      const phr=['MARIO-NHAY-LEN','NAM-TANG-LUC','SAO-VANG-RUC-RO','GIAI-CUU-PEACH'];
      document.getElementById('scPhrase').textContent=
        `${phr[(n.length+c.length)%4]} · ĐIỂM: ${st.worldScores[st.world]}`;
      showOvl('sComplete');
    },

    retryWorld() {
      G.enterWorld(st.world+1);
    },

    checkBudget(){},
    mazeClear(){mz={r:0,c:0};mazePath=[];renderMaze();},
    mazeCheck(){
      const fb=document.getElementById('qFb');
      if(MAZE_MAP[mz.r][mz.c]===2){fb.textContent='✓ Đường đi đúng!';fb.className='qfb ok';}
      else{fb.textContent='✗ Chưa đến đích. Tiếp tục thử!';fb.className='qfb bad';}
    },
    checkSort,
    sortReset,
    mKey(k,d){keys[k]=d;},
  };
})();
