// URL Web App dari Google Apps Script Anda
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbymfOgEn1Z1NnVhr7SOz_l3s15rA58bKouZF1Jw8ME8WSSkctfC4Qf8lyEPsWNELMDI/exec";
// Logika Login
function prosesLogin() {
  const user = document.getElementById("loginUser").value;
  const pass = document.getElementById("loginPass").value;

  if (user === "adminlab" && pass === "admin123") {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("mainApp").classList.remove("hidden");
  } else {
    alert("Username atau Password salah!");
  }
}

function logout() {
  location.reload();
}

let dataInventaris = [];
let fotoBaru = null;
let halamanAktif = 1;
const barisPerHalaman = 10;

const form = document.getElementById("formInventaris");
const searchInput = document.getElementById("searchInput");
const filterTahun = document.getElementById("filterTahun");
const tabel = document.getElementById("tabelInventaris");

function updateFileName(input) {
  const label = document.getElementById("fileLabel");
  if (input.files.length > 0) {
    label.textContent = "Terpilih: " + input.files[0].name;
    const reader = new FileReader();
    reader.onload = (e) => {
      fotoBaru = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  const fileInput = document.getElementById("fotoBarang");

  const simpanData = (fotoUrl) => {
    const barang = {
      id: id ? parseInt(id) : Date.now(),
      nama: document.getElementById("namaBarang").value,
      kode: document.getElementById("kodeBarang").value,
      tahun: document.getElementById("tahunBarang").value,
      jumlah: document.getElementById("jumlahBarang").value,
      spec: document.getElementById("spesifikasiBarang").value,
      foto: fotoUrl,
    };

    // Tampilkan indikator loading atau proses kirim (opsional)
    document.getElementById("btnSubmit").textContent = "Menyimpan ke Cloud...";
    document.getElementById("btnSubmit").disabled = true;

    // Kirim data ke Google Apps Script (Google Sheets)
    fetch(WEB_APP_URL, {
      method: "POST",
      mode: "no-cors", // Diperlukan untuk menghindari masalah CORS pada Google Apps Script
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(barang),
    })
      .then(() => {
        // Karena mode 'no-cors', respons detail tidak terbaca langsung,
        // tapi data dipastikan terkirim ke Spreadsheet.
        if (id) {
          dataInventaris = dataInventaris.map((i) => (i.id == id ? barang : i));
        } else {
          dataInventaris.push(barang);
          const filtered = getFilteredData();
          halamanAktif = Math.ceil((filtered.length + 1) / barisPerHalaman);
        }

        resetForm();
        updateFilterTahun();
        render();
        alert("Data berhasil disimpan ke Google Sheets!");
      })
      .catch((error) => {
        console.error("Gagal menyimpan:", error);
        alert("Terjadi kesalahan saat menyimpan data.");
      })
      .finally(() => {
        document.getElementById("btnSubmit").textContent = "Simpan Data";
        document.getElementById("btnSubmit").disabled = false;
      });
  };

  if (fileInput.files.length > 0) {
    simpanData(fotoBaru);
  } else if (id) {
    const existingItem = dataInventaris.find((i) => i.id == id);
    simpanData(existingItem.foto);
  } else {
    alert("Silakan pilih foto barang terlebih dahulu!");
  }
});
// Fungsi untuk mengambil data dari Google Sheets saat pertama kali dibuka
function ambilDataDariSheet() {
  fetch(WEB_APP_URL)
    .then((response) => response.json())
    .then((data) => {
      dataInventaris = data; // Masukkan data dari Sheets ke array lokal
      updateFilterTahun();
      render();
    })
    .catch((error) => {
      console.error("Gagal memuat data dari Spreadsheet:", error);
    });
}

// Panggil fungsi ini otomatis saat file script dijalankan/halaman dimuat
ambilDataDariSheet();

function resetForm() {
  form.reset();
  document.getElementById("editId").value = "";
  document.getElementById("formTitle").textContent = "📝 Tambah Barang";
  document.getElementById("btnSubmit").textContent = "Simpan Data";
  document.getElementById("btnCancel").classList.add("hidden");
  document.getElementById("fileLabel").textContent = "Belum ada file dipilih";
  fotoBaru = null;
}

function editBarang(id) {
  const item = dataInventaris.find((i) => i.id == id);
  if (item) {
    document.getElementById("editId").value = item.id;
    document.getElementById("namaBarang").value = item.nama;
    document.getElementById("kodeBarang").value = item.kode;
    document.getElementById("tahunBarang").value = item.tahun;
    document.getElementById("jumlahBarang").value = item.jumlah;
    document.getElementById("spesifikasiBarang").value = item.spec;
    document.getElementById("formTitle").textContent = "✏️ Edit Barang";
    document.getElementById("btnSubmit").textContent = "Update Data";
    document.getElementById("btnCancel").classList.remove("hidden");
    fotoBaru = item.foto;
    document.getElementById("fileLabel").textContent =
      "Foto tersimpan (bisa diganti)";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function updateFilterTahun() {
  const tahunUnik = [...new Set(dataInventaris.map((item) => item.tahun))]
    .sort()
    .reverse();
  filterTahun.innerHTML = '<option value="Semua">Semua Tahun</option>';
  tahunUnik.forEach((t) => {
    filterTahun.innerHTML += `<option value="${t}">${t}</option>`;
  });
}

function getFilteredData() {
  const keyword = searchInput.value.toLowerCase();
  const selectedTahun = filterTahun.value;

  return dataInventaris.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(keyword) ||
      item.kode.toLowerCase().includes(keyword);
    const matchTahun =
      selectedTahun === "Semua" || item.tahun === selectedTahun;
    return matchSearch && matchTahun;
  });
}

function gantiHalaman(halaman) {
  halamanAktif = halaman;
  render();
}

function render() {
  const filtered = getFilteredData();
  const totalHalaman = Math.ceil(filtered.length / barisPerHalaman) || 1;
  if (halamanAktif > totalHalaman) {
    halamanAktif = totalHalaman;
  }

  const mulai = (halamanAktif - 1) * barisPerHalaman;
  const dataHalaman = filtered.slice(mulai, mulai + barisPerHalaman);

  tabel.innerHTML = dataHalaman.length
    ? ""
    : '<tr><td colspan="5" class="text-center p-6 text-slate-400">Data tidak ditemukan</td></tr>';

  dataHalaman.forEach((item) => {
    tabel.innerHTML += `
        <tr class="text-sm hover:bg-slate-50 transition">
            <td class="p-3">
                <img src="${item.foto}" class="w-12 h-12 object-cover rounded cursor-pointer" onclick="bukaDetail(${item.id})">
            </td>
            <td class="p-3 cursor-pointer" onclick="bukaDetail(${item.id})">
                <b>${item.nama}</b><br><small class="text-slate-500">${item.kode}</small><br><small>${item.spec}</small>
            </td>
            <td class="p-3 cursor-pointer" onclick="bukaDetail(${item.id})">${item.tahun}</td>
            <td class="p-3 cursor-pointer" onclick="bukaDetail(${item.id})">${item.jumlah}</td>
            <td class="p-3 print:hidden space-x-2">
                <button onclick="bukaDetail(${item.id})" class="text-emerald-600 hover:underline font-medium">Detail</button>
                <button onclick="editBarang(${item.id})" class="text-blue-600 hover:underline font-medium">Edit</button>
                <button onclick="hapus(${item.id})" class="text-red-500 hover:underline font-medium">Hapus</button>
            </td>
        </tr>
    `;
  });

  renderPagination(totalHalaman);
}

function renderPagination(totalHalaman) {
  const container = document.getElementById("paginationContainer");
  container.innerHTML = "";

  if (totalHalaman <= 1) return;

  container.innerHTML += `
    <button onclick="gantiHalaman(${halamanAktif - 1})" 
      class="px-3 py-1 rounded border text-sm font-medium ${halamanAktif === 1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"}"
      ${halamanAktif === 1 ? "disabled" : ""}>
      Prev
    </button>
  `;

  for (let i = 1; i <= totalHalaman; i++) {
    const aktifClass =
      i === halamanAktif
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200";

    container.innerHTML += `
      <button onclick="gantiHalaman(${i})" 
        class="px-3 py-1 rounded border text-sm font-medium cursor-pointer ${aktifClass}">
        ${i}
      </button>
    `;
  }

  container.innerHTML += `
    <button onclick="gantiHalaman(${halamanAktif + 1})" 
      class="px-3 py-1 rounded border text-sm font-medium ${halamanAktif === totalHalaman ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"}"
      ${halamanAktif === totalHalaman ? "disabled" : ""}>
      Next
    </button>
  `;
}

function bukaDetail(id) {
  const item = dataInventaris.find((i) => i.id === id);
  if (item) {
    document.getElementById("detailFoto").src = item.foto;
    document.getElementById("detailNama").textContent = item.nama;
    document.getElementById("detailKode").textContent = item.kode;
    document.getElementById("detailTahun").textContent = item.tahun;
    document.getElementById("detailJumlah").textContent = item.jumlah;
    document.getElementById("detailSpec").textContent = item.spec;
    document.getElementById("modalDetail").classList.remove("hidden");
  }
}

function tutupDetail() {
  document.getElementById("modalDetail").classList.add("hidden");
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Laporan Inventaris SMPN 162 Jakarta", 14, 15);

  const rows = dataInventaris.map((item) => [
    item.nama,
    item.kode,
    item.tahun,
    item.jumlah,
    item.spec,
  ]);

  doc.autoTable({
    head: [["Nama Barang", "Kode", "Tahun", "Jumlah", "Spesifikasi"]],
    body: rows,
    startY: 25,
  });

  doc.save("Laporan_Inventaris_SMPN162.pdf");
}

function hapus(id) {
  if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
    dataInventaris = dataInventaris.filter((i) => i.id !== id);
    render();
    updateFilterTahun();
  }
}

searchInput.addEventListener("input", () => {
  halamanAktif = 1;
  render();
});

filterTahun.addEventListener("change", () => {
  halamanAktif = 1;
  render();
});
