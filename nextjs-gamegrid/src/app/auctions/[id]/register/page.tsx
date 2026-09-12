'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { ArrowLeft, Share2, Mail, MessageCircle, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Auction, AuctionCategoryConfig } from '@/types'

export default function RegisterAuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [categoryConfigs, setCategoryConfigs] = useState<AuctionCategoryConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    club: '',
    dob: '',
    mobile_number: '',
    email: ''
  })

  useEffect(() => {
    fetchAuctionData()
  }, [id])

  const fetchAuctionData = async () => {
    try {
      if (!supabase) return

      // Fetch auction details
      const { data: auctionData, error: auctionError } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', id)
        .single()

      if (auctionError) throw auctionError

      // Check if auction is published
      if (auctionData.status !== 'Published') {
        router.push('/auctions')
        return
      }

      setAuction(auctionData)

      // Fetch category configurations
      const { data: categoryConfigsData } = await supabase
        .from('auction_category_config')
        .select('*')
        .eq('auction_id', id)

      if (categoryConfigsData) setCategoryConfigs(categoryConfigsData)
    } catch (error) {
      console.error('Failed to fetch auction data:', error)
      setError('Failed to load auction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    if (!formData.category) {
      setError('Category is required')
      return
    }
    if (!formData.club.trim()) {
      setError('Club is required')
      return
    }
    if (!formData.dob) {
      setError('Date of birth is required')
      return
    }
    if (!formData.mobile_number.trim()) {
      setError('Mobile number is required')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate mobile number format (basic validation)
    const mobileRegex = /^[0-9+\-\s()]+$/
    if (!mobileRegex.test(formData.mobile_number)) {
      setError('Please enter a valid mobile number')
      return
    }

    setSubmitting(true)

    try {
      if (!supabase) {
        setError('Database connection error. Please try again.')
        setSubmitting(false)
        return
      }

      // Check if mobile number already exists for this auction
      const { data: existingMobile } = await supabase
        .from('auction_registrations')
        .select('id')
        .eq('auction_id', id)
        .eq('mobile_number', formData.mobile_number)
        .single()

      if (existingMobile) {
        setError('This mobile number is already registered for this auction')
        setSubmitting(false)
        return
      }

      // Check if email already exists for this auction
      const { data: existingEmail } = await supabase
        .from('auction_registrations')
        .select('id')
        .eq('auction_id', id)
        .eq('email', formData.email)
        .single()

      if (existingEmail) {
        setError('This email is already registered for this auction')
        setSubmitting(false)
        return
      }

      // Insert registration
      const { error: insertError } = await supabase
        .from('auction_registrations')
        .insert({
          auction_id: parseInt(id),
          name: formData.name,
          category: formData.category,
          club: formData.club,
          dob: formData.dob,
          mobile_number: formData.mobile_number,
          email: formData.email
        })

      if (insertError) throw insertError

      setSuccess(true)
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        club: '',
        dob: '',
        mobile_number: '',
        email: ''
      })
    } catch (error) {
      console.error('Failed to register:', error)
      setError('Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleShare = (platform: 'whatsapp' | 'email' | 'sms') => {
    const registrationUrl = `${window.location.origin}/auctions/${id}/register`
    const message = `Register for ${auction?.auction_name} auction! ${registrationUrl}`
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        break
      case 'email':
        window.open(`mailto:?subject=Auction Registration&body=${encodeURIComponent(message)}`, '_blank')
        break
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
        break
    }
  }

  if (loading) {
    return (
      <MainLayout currentView="register-auction" showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  if (!auction) {
    return (
      <MainLayout currentView="register-auction" showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500">Auction not found</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout currentView="register-auction" showHeader={false}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-extrabold text-white">Register for Auction</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleShare('whatsapp')}>
              <MessageCircle size={16} className="mr-2" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare('email')}>
              <Mail size={16} className="mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare('sms')}>
              <Phone size={16} className="mr-2" />
              SMS
            </Button>
          </div>
        </div>

        {/* Auction Info */}
        <div className="bg-gray-900 border border-white/5 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">{auction.auction_name}</h2>
          <p className="text-gray-400">{auction.description || 'No description available.'}</p>
          {auction.auction_date && (
            <p className="text-gray-400 mt-2">
              <span className="text-cyan-400">Date:</span> {new Date(auction.auction_date).toLocaleDateString()}
            </p>
          )}
          {auction.auction_venue && (
            <p className="text-gray-400">
              <span className="text-cyan-400">Venue:</span> {auction.auction_venue}
            </p>
          )}
        </div>

        {/* Registration Form */}
        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-emerald-500 mb-2">Registration Successful!</h3>
            <p className="text-gray-300 mb-4">You have been successfully registered for this auction.</p>
            <Button onClick={() => setSuccess(false)}>
              Register Another Player
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-white/5 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Player Registration</h2>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="Enter player name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category *</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">Select a category</option>
                  {categoryConfigs.map((config) => (
                    <option key={config.id} value={config.category_name}>
                      {config.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Club *</label>
                <input
                  type="text"
                  name="club"
                  required
                  value={formData.club}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="Enter club name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  required
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile_number"
                  required
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="Enter mobile number"
                />
                <p className="text-gray-500 text-xs mt-1">Must be unique for this auction</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="Enter email address"
                />
                <p className="text-gray-500 text-xs mt-1">Must be unique for this auction</p>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Registering...' : 'Register'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  )
}