import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    getDocs,
    writeBatch,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const firebaseConfig = {
    apiKey: "AIzaSyCE4T4upqxqhX6-pUN8chLF7xP0tW_lbfQ",
    authDomain: "billy-f23a3.firebaseapp.com",
    projectId: "billy-f23a3",
    storageBucket: "billy-f23a3.firebasestorage.app",
    messagingSenderId: "611207166200",
    appId: "1:611207166200:web:9640a59625e4fa4fa6230d",
    measurementId: "G-C0TT9LYV0S"
  };
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const db = getFirestore(app);
const stokRef = collection(db, 'barang');
const laporanRef = collection(db, 'transaksi');
let daftarStok = [];
let daftarLaporan = [];
let filterKeyword = '';
async function seedDataIfEmpty() {
    const stokSnap = await getDocs(stokRef);
    if (stokSnap.empty) {
        const batch = writeBatch(db);
        [
            { nama: 'Beras Ramos 5kg', kategori: 'Beras', harga: 65000, stok: 12, minStok: 5 },
            { nama: 'Minyak Goreng 1L', kategori: 'Minyak', harga: 18000, stok: 3, minStok: 5 },
            { nama: 'Gula Pasir 1kg', kategori: 'Gula', harga: 16000, stok: 15, minStok: 4 }
        ].forEach(item => {
            const newRef = doc(stokRef);
            batch.set(newRef, item);
        });
        await batch.commit();
    }
    const lapSnap = await getDocs(laporanRef);
    if (lapSnap.empty) {
        const awal = [
            { waktu: '2026-03-29 09:00', nama: 'Beras Ramos 5kg', tipe: 'masuk', jumlah: 10, ket: 'Restock Gudang', createdAt: Date.now() - 100000 },
            { waktu: '2026-03-29 10:30', nama: 'Minyak Goreng 1L', tipe: 'keluar', jumlah: 2, ket: 'Terjual', createdAt: Date.now() - 50000 }
        ];
        for (const lap of awal) await addDoc(laporanRef, lap);
    }
}
function mulaiListener() {
    onSnapshot(stokRef, (snapshot) => {
        daftarStok = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        tampilkanStok();
        isiPilihanDropdown();
    });
    const q = query(laporanRef, orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
        daftarLaporan = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        tampilkanLaporan();
    });
}
function gantiTab(tab) {
    document.getElementById('tab-stok').classList.add('hidden');
    document.getElementById('tab-transaksi').classList.add('hidden');
    document.getElementById('tab-laporan').classList.add('hidden');
    const inactive = "px-3 py-1.5 rounded text-sm font-medium text-white hover:bg-blue-600 transition";
    const active = "px-3 py-1.5 rounded text-sm font-medium bg-white text-blue-600 shadow-sm transition";
    document.getElementById('btn-stok').className = inactive;
    document.getElementById('btn-transaksi').className = inactive;
    document.getElementById('btn-laporan').className = inactive;
    if (tab === 'stok') {
        document.getElementById('tab-stok').classList.remove('hidden');
        document.getElementById('btn-stok').className = active;
        tampilkanStok();
    } else if (tab === 'transaksi') {
        document.getElementById('tab-transaksi').classList.remove('hidden');
        document.getElementById('btn-transaksi').className = active;
        isiPilihanDropdown();
    } else if (tab === 'laporan') {
        document.getElementById('tab-laporan').classList.remove('hidden');
        document.getElementById('btn-laporan').className = active;
        tampilkanLaporan();
    }
}
function tampilkanStok() {
    const tbody = document.getElementById('tabel-stok-body');
    tbody.innerHTML = '';

    const keyword = filterKeyword.toLowerCase();
    const data = daftarStok.filter(item =>
        item.nama.toLowerCase().includes(keyword) ||
        item.kategori.toLowerCase().includes(keyword)
    );

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-400 text-sm">Belum ada data barang.</td></tr>`;
        cekNotifikasiStok();
        return;
    }

    data.forEach((item) => {
        const statusStok = item.stok <= item.minStok
            ? `<span class="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">Menipis</span>`
            : `<span class="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">Aman</span>`;

        tbody.innerHTML += `
            <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="p-3 font-medium text-gray-800">${item.nama}</td>
                <td class="p-3 text-gray-600 text-xs">${item.kategori}</td>
                <td class="p-3 text-gray-600">Rp ${Number(item.harga).toLocaleString('id-ID')}</td>
                <td class="p-3 text-center font-bold text-gray-800">${item.stok}</td>
                <td class="p-3 text-center text-gray-500">${item.minStok} ${statusStok}</td>
                <td class="p-3 text-center">
                    <button onclick="hapusBarang('${item.id}')" class="text-rose-500 hover:text-rose-700 text-xs px-2 py-1 bg-rose-50 rounded"><i class="fa-solid fa-trash"></i> Hapus</button>
                </td>
            </tr>
        `;
    });
    cekNotifikasiStok();
}
function cariBarang() {
    filterKeyword = document.getElementById('input-cari').value;
    tampilkanStok();
}
function cekNotifikasiStok() {
    const kotakNotif = document.getElementById('kotak-notif');
    const barangMenipis = daftarStok.filter(item => item.stok <= item.minStok);

    if (barangMenipis.length > 0) {
        const daftarNama = barangMenipis.map(b => b.nama).join(', ');
        kotakNotif.innerHTML = `
            <div class="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-center justify-between">
                <div>
                    <span class="font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Peringatan Stok Menipis:</span>
                    <span>${daftarNama} sudah mencapai atau di bawah batas minimum!</span>
                </div>
            </div>
        `;
    } else {
        kotakNotif.innerHTML = '';
    }
}
function isiPilihanDropdown() {
    const selectMasuk = document.getElementById('pilih-barang-masuk');
    const selectKeluar = document.getElementById('pilih-barang-keluar');
    selectMasuk.innerHTML = '<option value="">-- Pilih Barang --</option>';
    selectKeluar.innerHTML = '<option value="">-- Pilih Barang --</option>';
    daftarStok.forEach((item) => {
        const opsi = `<option value="${item.id}">${item.nama} (Sisa: ${item.stok})</option>`;
        selectMasuk.innerHTML += opsi;
        selectKeluar.innerHTML += opsi;
    });
}
async function prosesTransaksi(event, tipe) {
    event.preventDefault();
    const selectId = tipe === 'masuk' ? 'pilih-barang-masuk' : 'pilih-barang-keluar';
    const inputJumlahId = tipe === 'masuk' ? 'jumlah-masuk' : 'jumlah-keluar';
    const inputKetId = tipe === 'masuk' ? 'ket-masuk' : 'ket-keluar';
    const id = document.getElementById(selectId).value;
    const jumlah = parseInt(document.getElementById(inputJumlahId).value);
    const ket = document.getElementById(inputKetId).value;
    if (!id || !jumlah) return;
    const barang = daftarStok.find(b => b.id === id);
    if (!barang) return;
    if (tipe === 'keluar' && barang.stok < jumlah) {
        alert(`Stok tidak cukup! Sisa stok saat ini hanya ${barang.stok}`);
        return;
    }
    try {
        const stokBaru = tipe === 'masuk' ? barang.stok + jumlah : barang.stok - jumlah;
        await updateDoc(doc(db, 'barang', id), { stok: stokBaru });
        const waktuSekarang = new Date().toISOString().slice(0, 16).replace('T', ' ');
        await addDoc(laporanRef, {
            waktu: waktuSekarang,
            nama: barang.nama,
            tipe: tipe,
            jumlah: jumlah,
            ket: ket || (tipe === 'masuk' ? 'Barang Masuk' : 'Barang Keluar'),
            createdAt: Date.now()
        });
        document.getElementById(inputJumlahId).value = '';
        document.getElementById(inputKetId).value = '';
        alert(`Transaksi barang ${tipe} berhasil dicatat!`);
    } catch (err) {
        console.error(err);
        alert('Gagal menyimpan transaksi: ' + err.message);
    }
}
function tampilkanLaporan() {
    const tbody = document.getElementById('tabel-laporan-body');
    tbody.innerHTML = '';

    if (daftarLaporan.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-400 text-sm">Belum ada riwayat transaksi.</td></tr>`;
        return;
    }
    daftarLaporan.forEach(log => {
        const badge = log.tipe === 'masuk'
            ? `<span class="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded font-semibold">MASUK</span>`
            : `<span class="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded font-semibold">KELUAR</span>`;
        const tanda = log.tipe === 'masuk' ? '+' : '-';
        tbody.innerHTML += `
            <tr class="border-b border-gray-50">
                <td class="p-3 text-xs text-gray-500">${log.waktu}</td>
                <td class="p-3 font-medium text-gray-800">${log.nama}</td>
                <td class="p-3">${badge}</td>
                <td class="p-3 text-center font-bold ${log.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}">${tanda}${log.jumlah}</td>
                <td class="p-3 text-gray-600 text-xs">${log.ket}</td>
            </tr>
        `;
    });
}
function bukaModal() {
    document.getElementById('modal-barang').classList.remove('hidden');
}
function tutupModal() {
    document.getElementById('modal-barang').classList.add('hidden');
}
async function simpanBarangBaru(event) {
    event.preventDefault();

    const baru = {
        nama: document.getElementById('tambah-nama').value,
        kategori: document.getElementById('tambah-kategori').value,
        harga: Number(document.getElementById('tambah-harga').value),
        stok: Number(document.getElementById('tambah-stok').value),
        minStok: Number(document.getElementById('tambah-min').value)
    };

    try {
        await addDoc(stokRef, baru);
        tutupModal();
        document.querySelector('#modal-barang form').reset();
    } catch (err) {
        console.error(err);
        alert('Gagal menyimpan barang: ' + err.message);
    }
}

async function hapusBarang(id) {
    const barang = daftarStok.find(b => b.id === id);
    if (!barang) return;
    if (!confirm(`Yakin ingin menghapus ${barang.nama}?`)) return;

    try {
        await deleteDoc(doc(db, 'barang', id));
    } catch (err) {
        console.error(err);
        alert('Gagal menghapus: ' + err.message);
    }
}
async function resetDataSemua() {
    if (!confirm('Reset data kembali ke awal? Semua data di Firestore akan dihapus.')) return;

    try {
        const stokSnap = await getDocs(stokRef);
        const lapSnap = await getDocs(laporanRef);

        const batch = writeBatch(db);
        stokSnap.forEach(d => batch.delete(d.ref));
        lapSnap.forEach(d => batch.delete(d.ref));
        await batch.commit();

        await seedDataIfEmpty();
        alert('Data berhasil di-reset!');
    } catch (err) {
        console.error(err);
        alert('Gagal reset: ' + err.message);
    }
}
window.gantiTab = gantiTab;
window.cariBarang = cariBarang;
window.bukaModal = bukaModal;
window.tutupModal = tutupModal;
window.simpanBarangBaru = simpanBarangBaru;
window.hapusBarang = hapusBarang;
window.prosesTransaksi = prosesTransaksi;
window.resetDataSemua = resetDataSemua;

window.addEventListener('DOMContentLoaded', async () => {
    await seedDataIfEmpty();
    mulaiListener();
    tampilkanStok();
});